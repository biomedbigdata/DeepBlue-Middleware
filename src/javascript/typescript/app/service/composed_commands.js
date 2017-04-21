"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Observable_1 = require("rxjs/Observable");
const rxjs_1 = require("rxjs");
const deepblue_1 = require("../service/deepblue");
const progresselement_1 = require("../service/progresselement");
class Manager {
    constructor() { }
    static getComposedCommands() {
        if (this.composed_commands) {
            return Observable_1.Observable.of(this.composed_commands);
        }
        let subject = new rxjs_1.Subject();
        this.dbs.init().subscribe(() => {
            this.composed_commands = new ComposedCommands(this.dbs);
            subject.next(this.composed_commands);
            subject.complete();
        });
        return subject.asObservable();
    }
}
Manager.dbs = new deepblue_1.DeepBlueService();
Manager.composed_commands = null;
exports.Manager = Manager;
class ComposedCommands {
    constructor(deepBlueService) {
        this.deepBlueService = deepBlueService;
    }
    selectMultipleExperiments(experiments, progress_element) {
        console.log("selectMultipleExperiments");
        let observableBatch = [];
        experiments.forEach((experiment) => {
            observableBatch.push(this.deepBlueService.selectExperiment(experiment, progress_element));
        });
        return Observable_1.Observable.forkJoin(observableBatch);
    }
    intersectWithSelected(current_operations, selected_data, progress_element) {
        let observableBatch = [];
        current_operations.forEach((current_op) => {
            selected_data.forEach((data) => {
                let o = this.deepBlueService.intersection(current_op, data, progress_element);
                observableBatch.push(o);
            });
        });
        return Observable_1.Observable.forkJoin(observableBatch);
    }
    countRegionsBatch(query_ids, progress_element) {
        console.log("countRegion");
        let observableBatch = [];
        query_ids.forEach((op_exp, key) => {
            let o = new Observable_1.Observable((observer) => {
                this.deepBlueService.count_regions(op_exp, progress_element).subscribe((result) => {
                    observer.next(result);
                    observer.complete();
                });
            });
            observableBatch.push(o);
        });
        return Observable_1.Observable.forkJoin(observableBatch);
    }
    countOverlaps(data_query_id, experiments_name) {
        console.log("countOverlaps");
        var start = new Date().getTime();
        let progress_element = new progresselement_1.ProgressElement();
        let total = data_query_id.length * experiments_name.length;
        progress_element.reset(total);
        let response = new rxjs_1.Subject();
        this.selectMultipleExperiments(experiments_name, progress_element).subscribe((selected_experiments) => {
            console.log("selectMultipleExperiments 2");
            this.intersectWithSelected(data_query_id, selected_experiments, progress_element).subscribe((overlap_ids) => {
                console.log("intersectWithSelected");
                this.countRegionsBatch(overlap_ids, progress_element).subscribe((datum) => {
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
    handleError(error) {
        let errMsg;
        if (error instanceof Response) {
            const body = error.json() || '';
            errMsg = JSON.stringify(body);
        }
        else {
            errMsg = error.message ? error.message : error.toString();
        }
        console.log(errMsg);
        return Observable_1.Observable.throw(errMsg);
    }
}
exports.ComposedCommands = ComposedCommands;
