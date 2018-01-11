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
    DeepBlueMiddlewareOverlapResult,
    DeepBlueTiling,
    DeepBlueOperationArgs,
    DeepBlueDataParameter,
    DeepBlueError
} from '../domain/operations';
import { IOperation } from 'app/domain/interfaces';

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

                    let overlapResult = new DeepBlueMiddlewareOverlapResult(result.getDataName(), result.getDataId(),
                        result.getFilterName(), result.getFilterQuery(),
                        result.resultAsCount());

                    status.addPartialData(overlapResult);
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

    loadQuery(query_id: Id, status: RequestStatus): Observable<IOperation> {

        return this.deepBlueService.info(query_id, status).map((fullMetadata: FullMetadata) => {
            let type = fullMetadata.type();
            let id = fullMetadata.id;
            let name = fullMetadata.name;

            let content;
            if (name) {
                content = new DeepBlueDataParameter(new Name(name));
            } else {
                content = new DeepBlueOperationArgs(fullMetadata.get('args'));
            }

            console.log("\n\nFULL_INFO", fullMetadata);


            switch (type) {
                case "annotation_select":
                case "experiment_select": {
                    console.log("annotation or exp select");
                    return Observable.of(new DeepBlueOperation(content, id, type));
                }

                case "filter": {
                    let filter_parameters = FilterParameter.fromObject(fullMetadata['values']['args']);
                    let _query = new Id(fullMetadata.get('args')['query']);
                    console.log("filter");
                    return this.loadQuery(_query, status).flatMap((op) => {
                        console.log("another load query inside filter");
                        return Observable.of(new DeepBlueFilter(op, filter_parameters, query_id));
                    });
                }

                case "tiling": {
                    console.log("tiling");
                    let genome = fullMetadata.get('genome');
                    let size = Number(fullMetadata.get('size'));
                    let chromosomes = fullMetadata.get('chromosomes');
                    return Observable.of(new DeepBlueTiling(size, genome, chromosomes, id));
                }

                case "intersect":
                case "overlap": {
                    let data = new Id(fullMetadata.get('args')['qid_1']);
                    let filter = new Id(fullMetadata.get('args')['qid_2']);
                    console.log("intersect");

                    console.log(data);
                    console.log(filter);

                    console.log("fullmetada", fullMetadata)
                    //console.log("data", data);
                    //console.log("filter", filter);

                    return Observable.forkJoin([
                        this.loadQuery(data, status),
                        this.loadQuery(filter, status)
                    ]).map(([op_data, op_filter]) => {
                        return new DeepBlueIntersection(op_data, op_filter, id);
                    })
                }

                default: {
                    console.error("Invalid type", type);
                    return Observable.of(new DeepBlueOperation(new DeepBlueDataParameter(name), id, type));
                }
            }
        }).flatMap((o) => o);
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
