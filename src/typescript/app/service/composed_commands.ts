import { RequestStatus } from '../domain/status';
import { Observable } from 'rxjs/Observable'
import { Subject } from "rxjs";

import { DeepBlueService } from '../service/deepblue';

import { IdName, Name, Id, FullMetadata } from '../domain/deepblue';

import {
    DeepBlueIntersection,
    DeepBlueFilter,
    DeepBlueOperation,
    DeepBlueResult,
    FilterParameter,
    DeepBlueSelectData,
    DeepBlueTilingRegions
} from '../domain/operations';

export class ComposedCommands {
    constructor(private deepBlueService: DeepBlueService) { }

    selectMultipleExperiments(experiments: Name[], status: RequestStatus): Observable<DeepBlueOperation[]> {

        let total = 0;
        let observableBatch: Observable<DeepBlueOperation>[] = [];

        experiments.forEach((experiment: Name) => {
            observableBatch.push(this.deepBlueService.selectExperiment(experiment, status));
        });

        return Observable.forkJoin(observableBatch);
    }

    intersectWithSelected(current_operations: DeepBlueOperation[], selected_data: DeepBlueOperation[],
        status: RequestStatus): Observable<DeepBlueIntersection[]> {

        let observableBatch: Observable<DeepBlueIntersection>[] = [];

        current_operations.forEach((current_op) => {
            selected_data.forEach((data) => {
                let o = this.deepBlueService.intersection(current_op, data, status);
                observableBatch.push(o);
            });
        });

        return Observable.forkJoin(observableBatch);
    }

    filterWithSelected(current_operations: DeepBlueOperation[], filter: FilterParameter,
        status: RequestStatus): Observable<DeepBlueOperation[]> {

        let observableBatch: Observable<DeepBlueOperation>[] = [];

        current_operations.forEach((current_op) => {
            let o = this.deepBlueService.filter_regions(current_op, filter, status);
            observableBatch.push(o);
        });

        return Observable.forkJoin(observableBatch);
    }

    countRegionsBatch(query_ops: DeepBlueOperation[], status: RequestStatus): Observable<DeepBlueResult[]> {
        let observableBatch: Observable<DeepBlueResult>[] = [];

        query_ops.forEach((op_exp, key) => {
            let o: Observable<DeepBlueResult> = new Observable((observer) => {
                this.deepBlueService.count_regions(op_exp, status).subscribe((result) => {
                    observer.next(result);
                    observer.complete();
                })
            });

            observableBatch.push(o);
        });

        return Observable.forkJoin(observableBatch);
    }

    applyFilter(current_operations: DeepBlueOperation[], filters: FilterParameter[], status: RequestStatus): Observable<DeepBlueOperation[]> {
        if (filters.length == 0) {
            return Observable.of(current_operations);
        } else {
            let filter = filters.shift();

            let subject = new Subject<DeepBlueFilter[]>();
            this.filterWithSelected(current_operations, filter, status).subscribe((new_operation: DeepBlueOperation[]) => {
                return this.applyFilter(new_operation, filters, status).subscribe((queries_filtered: DeepBlueFilter[]) => {
                    subject.next(queries_filtered);
                    subject.complete();
                });
            });

            return subject.asObservable();
        }
    }

    countOverlaps(data_query_id: DeepBlueOperation[], experiments_name: Name[], filters: FilterParameter[], status: RequestStatus): Observable<DeepBlueResult[]> {
        var start = new Date().getTime();
        let total = data_query_id.length * experiments_name.length * 4;
        status.reset(total);

        let response: Subject<DeepBlueResult[]> = new Subject<DeepBlueResult[]>();

        status.setStep("Selecting experiments regions");

        this.selectMultipleExperiments(experiments_name, status).subscribe((selected_experiments: DeepBlueOperation[]) => {
            status.setStep("Overlaping regions");

            this.applyFilter(selected_experiments, filters, status).subscribe((filtered_data: DeepBlueFilter[]) => {
                this.intersectWithSelected(data_query_id, filtered_data, status).subscribe((overlap_ops: DeepBlueOperation[]) => {
                    status.setStep("Intersecting regions");

                    this.countRegionsBatch(overlap_ops, status).subscribe((datum: DeepBlueResult[]) => {
                        var end = new Date().getTime();
                        setTimeout(() => {
                            response.next(datum);
                            response.complete();
                        });
                    });
                });
            });
        });

        return response.asObservable();
    }

    countGenesOverlaps(data_query_id: DeepBlueOperation[], gene_model: Name, status: RequestStatus): Observable<DeepBlueResult[]> {
        var start = new Date().getTime();

        let total = data_query_id.length * data_query_id.length * 3;
        status.reset(total);

        let response: Subject<DeepBlueResult[]> = new Subject<DeepBlueResult[]>();

        status.setStep("Selecting genes regions");

        this.deepBlueService.selectGenes(gene_model, status).subscribe((selected_genes: DeepBlueOperation) => {

            this.intersectWithSelected(data_query_id, [selected_genes], status).subscribe((overlap_ids: DeepBlueOperation[]) => {
                status.setStep("Intersecting regions");

                this.countRegionsBatch(overlap_ids, status).subscribe((datum: DeepBlueResult[]) => {
                    var end = new Date().getTime();
                    setTimeout(() => {
                        response.next(datum);
                        response.complete();
                    });
                });
            });
        });

        return response.asObservable();
    }

    enrichRegionsGoTerms(data_query_id: DeepBlueOperation[], gene_model: Name, status: RequestStatus): Observable<DeepBlueResult[]> {
        var start = new Date().getTime();

        let total = data_query_id.length * data_query_id.length * 3;
        status.reset(total);

        let response: Subject<DeepBlueResult[]> = new Subject<DeepBlueResult[]>();

        let observableBatch: Observable<DeepBlueResult>[] = [];

        data_query_id.forEach((current_op) => {
            let o = this.deepBlueService.enrich_regions_go_terms(current_op, gene_model, status);
            observableBatch.push(o);
        });

        return Observable.forkJoin(observableBatch);
    }

    loadQuery(query_id: Id, status: RequestStatus): Observable<DeepBlueOperation> {
        return this.deepBlueService.info(query_id, status).map((fullMetadata: FullMetadata) => {

            let type = fullMetadata.type();
            let name = fullMetadata.name
            let id = new Id(fullMetadata.id);

            switch (type) {
                case "annotation_select": {
                    return new DeepBlueSelectData(new Name(name), id, type);
                }

                case "experiment_select": {
                    return new DeepBlueSelectData(new Name(name), id, type);
                }

                case "genes_select": {
                    return new DeepBlueSelectData(new Name(fullMetadata.values['genes']), id, type);
                }


                case "intersect": case "overlap": {
                    let data = new Id(fullMetadata.values['qid_1']);
                    let filter = new Id(fullMetadata.values['qid_1']);

                    Observable.forkJoin(this.loadQuery(data, status), this.loadQuery(filter, status))
                        .subscribe(([op_data, op_filter]) => {
                            return new DeepBlueIntersection(op_data, op_filter, id);
                        });
                }

                case "filter": {
                    let filter_parameters = FilterParameter.fromObject(fullMetadata.values);
                    let query_id = new Id(fullMetadata.values['query']);

                    this.loadQuery(query_id, status).subscribe((op) => {
                        return new DeepBlueFilter(op, filter_parameters, query_id);
                    });
                }

                case "tiling": {
                    let genome = fullMetadata.values['genome'];
                    let size = Number(fullMetadata.values['size'])
                    return new DeepBlueTilingRegions(size, genome, id);
                }

                default: {
                    console.error("Invalid type", type);
                    return new DeepBlueSelectData(new Name("name"), id, type);
                }
            }
        });
    }

    private handleError(error: Response | any) {
        let errMsg: string;
        if (error instanceof Response) {
            const body = error.json() || '';
            errMsg = JSON.stringify(body);
        } else {
            errMsg = error.message ? error.message : error.toString();
        }
        return Observable.throw(errMsg);
    }
}
