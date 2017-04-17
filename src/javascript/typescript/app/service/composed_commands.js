"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const deepblue_1 = require("../service/deepblue");
const progresselement_1 = require("../service/progresselement");
const deepblue_2 = require("../domain/deepblue");
const composed_commands = express_1.Router();
const deepBlueUrl = "http://deepblue.mpi-inf.mpg.de";
composed_commands.get('/', (req, res, next) => {
    res.send('respond with a resource');
});
let dbs = new deepblue_1.DeepBlueService();
dbs.init().subscribe(() => {
    console.log("INUITTTTT00");
    dbs.execute("info", { "id": "me" }).subscribe((value) => {
        console.log(value);
        console.log("XXXXXXXXXXXXXXXX000");
    });
    let progress_bar = new progresselement_1.ProgressElement();
    let request_count = 10;
    let exp = new deepblue_2.IdName("e100269", "HSC_PB_I31_covg.bedgraph");
    dbs.selectExperiment(exp, progress_bar, request_count).subscribe((deepBlueOperation) => {
        console.log(deepBlueOperation);
    });
});
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
exports.default = composed_commands;
