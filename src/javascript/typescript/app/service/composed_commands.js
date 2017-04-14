"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const deepblue_1 = require("../service/deepblue");
const composed_commands = express_1.Router();
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
});
/*
class ComposedCommands {

    deepBlueUrl : string = "http://deepblue.mpi-inf.mpg.de";

    idNamesQueryCache: DataCache<IdName, DeepBlueOperation> = new DataCache<IdName, DeepBlueOperation>();

    deepBlueService : DeepBlueService;

    selectExperiment(experiment: IdName, progress_element: ProgressElement, request_count: number): Observable<DeepBlueOperation> {
        if (!experiment) {
            return Observable.empty<DeepBlueOperation>();
        }

        if (this.idNamesQueryCache.get(experiment, request_count)) {
            console.log("selectExperiment hit");
            progress_element.increment(request_count);
            let cached_operation = this.idNamesQueryCache.get(experiment, request_count);
            return Observable.of(cached_operation);
        }

        let params: URLSearchParams = new URLSearchParams();
        params.set("experiment_name", experiment.name);
        params.set("genome", this.getGenome().name);
        return this.http.get(this.deepBlueUrl + "/select_experiments", { "search": params })
            .map((res: Response) => {
                let body = res.json();
                let response: string = body[1] || "";
                progress_element.increment(request_count);
                return new DeepBlueOperation(experiment, response, "select_experiment", request_count);
            })
            .do((operation) => {
                this.idNamesQueryCache.put(experiment, operation)
            })
            .catch(this.handleError);
    }

    selectMultipleExperiments(experiments: IdName[], progress_element: ProgressElement, request_count: number): Promise<DeepBlueOperation[]> {

        var observableBatch = [];
        experiments.forEach((experiment, key) => {
            console.log(experiment);
            progress_element.increment(request_count);
            observableBatch.push(this.selectExperiment(experiment, progress_element, request_count));
        });

        return Q.all(observableBatch);
    }

    countOverlaps(queries: Array<String>, experiments: Array<String>) {
        // Each experiment is started, selected, overlaped, count, get request data (4 times each)
        let total = queries.length * experiments.length;

        var start = new Date().getTime();

        this.deepBlueService.selectMultipleExperiments(experiments, this.progress_element, this.current_request).subscribe((selected_experiments: DeepBlueOperation[]) => {
            if (selected_experiments.length == 0) {
                this.reloadPlot([]);
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
}
}
*/
exports.default = composed_commands;
