import { Observable } from 'rxjs/Observable'
import { Subject } from "rxjs";

import { DeepBlueService } from '../service/deepblue';
import { ProgressElement } from '../service/progresselement';

import { IdName, Name } from '../domain/deepblue';
import { DeepBlueIntersection, DeepBlueOperation, DeepBlueResult } from '../domain/operations';

export class Manager {

    private static dbs: DeepBlueService = new DeepBlueService();
    private static composed_commands: ComposedCommands = null;

    constructor() { }

    static getComposedCommands(): Observable<ComposedCommands> {

        if (this.composed_commands) {
            return Observable.of(this.composed_commands);
        }

        let subject = new Subject<ComposedCommands>();
        this.dbs.init().subscribe(() => {
            this.composed_commands = new ComposedCommands(this.dbs);
            subject.next(this.composed_commands);
            subject.complete();
        })
        return subject.asObservable();
    }
}


export class ComposedCommands {
    constructor(private deepBlueService: DeepBlueService) { }

    selectMultipleExperiments(experiments: Name[], progress_element: ProgressElement): Observable<DeepBlueOperation[]> {

        console.log("selectMultipleExperiments");
        let observableBatch: Observable<DeepBlueOperation>[] = [];

        experiments.forEach((experiment: Name) => {
            observableBatch.push(this.deepBlueService.selectExperiment(experiment, progress_element));
        });

        return Observable.forkJoin(observableBatch);
    }

    intersectWithSelected(current_operations: DeepBlueOperation[], selected_data: DeepBlueOperation[],
        progress_element: ProgressElement): Observable<DeepBlueIntersection[]> {

        let observableBatch: Observable<DeepBlueIntersection>[] = [];

        current_operations.forEach((current_op) => {
            selected_data.forEach((data) => {
                let o = this.deepBlueService.intersection(current_op, data, progress_element);
                observableBatch.push(o);
            });
        });

        return Observable.forkJoin(observableBatch);
    }


    countRegionsBatch(query_ids: DeepBlueOperation[], progress_element: ProgressElement): Observable<DeepBlueResult[]> {
        console.log("countRegion");
        let observableBatch: Observable<DeepBlueResult>[] = [];

        query_ids.forEach((op_exp, key) => {
            let o: Observable<DeepBlueResult> = new Observable((observer) => {
                this.deepBlueService.count_regions(op_exp, progress_element).subscribe((result) => {
                    observer.next(result);
                    observer.complete();
                })
            });

            observableBatch.push(o);
        });

        return Observable.forkJoin(observableBatch);
    }


    countOverlaps(data_query_id: DeepBlueOperation[], experiments_name: Name[]): Observable<DeepBlueResult[]> {
        console.log("countOverlaps");

        var start = new Date().getTime();
        let progress_element: ProgressElement = new ProgressElement();
        let total = data_query_id.length * experiments_name.length;
        progress_element.reset(total);

        let response: Subject<DeepBlueResult[]> = new Subject<DeepBlueResult[]>();

        this.selectMultipleExperiments(experiments_name, progress_element).subscribe((selected_experiments: DeepBlueOperation[]) => {
            console.log("selectMultipleExperiments 2");
            this.intersectWithSelected(data_query_id, selected_experiments, progress_element, ).subscribe((overlap_ids: DeepBlueOperation[]) => {
                console.log("intersectWithSelected");

                this.countRegionsBatch(overlap_ids, progress_element).subscribe((datum: DeepBlueResult[]) => {
                    var end = new Date().getTime();
                    console.log("FINISHED", end - start);
                    setTimeout(() => {
                        response.next(datum);
                        response.complete();
                    });
                });
            });
        });

        return response.asObservable();
    }

    private handleError(error: Response | any) {
        let errMsg: string;
        if (error instanceof Response) {
            const body = error.json() || '';
            errMsg = JSON.stringify(body);
        } else {
            errMsg = error.message ? error.message : error.toString();
        }
        console.log(errMsg);
        return Observable.throw(errMsg);
    }
}
