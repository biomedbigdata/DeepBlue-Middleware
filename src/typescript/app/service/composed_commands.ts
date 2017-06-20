import { RequestStatus } from '../domain/status';
import { Observable } from 'rxjs/Observable'
import { Subject } from "rxjs";

import { DeepBlueService } from '../service/deepblue';

import { IdName, Name } from '../domain/deepblue';
import { DeepBlueIntersection, DeepBlueOperation, DeepBlueResult } from '../domain/operations';

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

    countRegionsBatch(query_ids: DeepBlueOperation[], status: RequestStatus): Observable<DeepBlueResult[]> {
        let observableBatch: Observable<DeepBlueResult>[] = [];

        query_ids.forEach((op_exp, key) => {
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


    countOverlaps(data_query_id: DeepBlueOperation[], experiments_name: Name[], status: RequestStatus): Observable<DeepBlueResult[]> {
        var start = new Date().getTime();
        let total = data_query_id.length * experiments_name.length * 4;
        status.reset(total);

        let response: Subject<DeepBlueResult[]> = new Subject<DeepBlueResult[]>();

        status.setStep("Selecting experiments regions");

        this.selectMultipleExperiments(experiments_name, status).subscribe((selected_experiments: DeepBlueOperation[]) => {
            status.setStep("Overlaping regions");

            this.intersectWithSelected(data_query_id, selected_experiments, status).subscribe((overlap_ids: DeepBlueOperation[]) => {
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

    calculateEnrichment(data_query_id: DeepBlueOperation[], gene_model: Name, status: RequestStatus): Observable<DeepBlueResult[]> {
        var start = new Date().getTime();

        let total = data_query_id.length * data_query_id.length * 3;
        status.reset(total);

        let response: Subject<DeepBlueResult[]> = new Subject<DeepBlueResult[]>();

        let observableBatch: Observable<DeepBlueResult>[] = [];

        data_query_id.forEach((current_op) => {
            let o = this.deepBlueService.calculate_enrichment(current_op, gene_model, status);
            observableBatch.push(o);
        });

        return Observable.forkJoin(observableBatch);
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
