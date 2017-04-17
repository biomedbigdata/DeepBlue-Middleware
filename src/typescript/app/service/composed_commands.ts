import { Router } from 'express';
import { Promise } from '@types/q'

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'

import { DeepBlueService } from '../service/deepblue';
import { ProgressElement } from '../service/progresselement';
import { DataCache } from '../service/cache';

import { IdName } from '../domain/deepblue'
import { DeepBlueOperation } from '../domain/operations'

const composed_commands: Router = Router();

const deepBlueUrl: string = "http://deepblue.mpi-inf.mpg.de";

composed_commands.get('/', (req, res, next) => {
    res.send('respond with a resource');
});

let dbs: DeepBlueService = new DeepBlueService();


dbs.init().subscribe(() => {
    console.log("INUITTTTT00");
    dbs.execute("info", { "id": "me" }).subscribe((value: Object[]) => {
        console.log(value);
        console.log("XXXXXXXXXXXXXXXX000");
    });

    let progress_bar = new ProgressElement();
    let request_count = 10;

    let exp = new IdName("e100269", "HSC_PB_I31_covg.bedgraph");

    dbs.selectExperiment(exp, progress_bar, request_count).subscribe((deepBlueOperation: DeepBlueOperation) => {
        console.log(deepBlueOperation);
    });
})




/*
class ComposedCommands {


    deepBlueService: DeepBlueService;

    constructor(private requestCount : number = 0) {    }

    selectMultipleExperiments(experiments: IdName[], progress_element: ProgressElement, request_count: number): Observable<DeepBlueOperation[]> {

        let observableBatch: Observable<DeepBlueOperation>[] = [];

        experiments.forEach((experiment, key) => {
            console.log(experiment);
            progress_element.increment(request_count);
            observableBatch.push(this.deepBlueService.selectExperiment(experiment, progress_element, request_count));
        });

        return Observable.forkJoin(observableBatch);
    }

    countOverlaps(queries: Array<String>, experiments: Array<String>) {

        this.requestCount++;
        let current_request = this.requestCount;

        var start = new Date().getTime();

        let progress_element: ProgressElement = new ProgressElement();
        // Each experiment is started, selected, overlaped, count, get request data (4 times each)
        let total = queries.length * experiments.length;

        progress_element.reset(total, current_request);

        this.selectMultipleExperiments(experiments, progress_element, current_request).subscribe((selected_experiments: DeepBlueOperation[]) => {
            if (selected_experiments.length == 0) {
                // TODO: mark end
                return;
            }
            if (selected_experiments[0].request_count != this.current_request) {
                return;
            }

            let current: DeepBlueOperation[] = this.selectedData.getStacksTopOperation();

            if (current == null) {
                // Finish processing
                return;
            }

            this.deepBlueService.intersectWithSelected(current, selected_experiments, this.progress_element, this.current_request).subscribe((overlap_ids: StackValue[]) => {
                if (overlap_ids.length == 0) {
                    // Finish processing
                    return;
                }
                if (overlap_ids[0].getDeepBlueOperation().request_count != this.current_request) {
                    return;
                }

                this.deepBlueService.countRegionsBatch(overlap_ids, this.progress_element, this.current_request).subscribe((datum: StackValue[]) => {
                    if (datum.length == 0) {
                        // Finish processing
                        return;
                    }
                    if (datum[0].getDeepBlueOperation().request_count != this.current_request) {
                        return;
                    }

                    var end = new Date().getTime();
                    // Now calculate and output the difference
                    console.log(end - start);
                    this.currentlyProcessing = [];
                })
            });
        });
    }

    private handleError(error: Response | any) {
        let errMsg: string;
        if (error instanceof Response) {
            const body = error.json() || '';
            const err = body.error || JSON.stringify(body);
            errMsg = `${err.status} - ${err.statusText || ''} ${err}`
        } else {
            errMsg = error.message ? error.message : error.toString();
        }
        console.log(errMsg);
        return Observable.throw(errMsg);
    }
}

*/

export default composed_commands;
