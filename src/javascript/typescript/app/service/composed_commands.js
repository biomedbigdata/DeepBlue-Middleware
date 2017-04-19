"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Observable_1 = require("rxjs/Observable");
const rxjs_1 = require("rxjs");
const deepblue_1 = require("../service/deepblue");
const progresselement_1 = require("../service/progresselement");
/*
dbs.init().subscribe(() => {

    let cc = new ComposedCommands(dbs);

    let progress_bar = new ProgressElement();

    let exp = new IdName("e100269", "HSC_PB_I31_covg./bedgraph");
    let exp2 = new IdName("e100270", "Bcell_PB_I53_fracmeth.bedgraph");
    let exp3 = new IdName("e103786", "wgEncodeBroadHmmK562HMM");
    let exp4 = new IdName("e103787", "wgEncodeBroadHmmNhekHMM");
    let exp5 = new IdName("e103795", "E065_15_coreMarks_mnemonics.bed.bed");
    let exp6 = new IdName("e103794", "wgEncodeBroadHmmGm12878HMM");
    let exp7 = new IdName("e103795", "E065_15_coreMarks_mnemonics.bed.bed");
    let exp8 = new IdName("e100277", "MK_BM_I22_covg.bedgraph");

    let ee = new IdName("e100291", "HSC_PB_I30_covg.bedgraph");
    let ff = new IdName("e100296", "RNA_D1_MLP0_100.wig");

    cc.countOverlaps([ff], [exp5, exp6, exp7, exp8, ee, ff]).subscribe((datum: DeepBlueResult[]) => {
        console.log("FINISHED");
    });
});
*/
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
            console.log("Selecting:", experiment);
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
        // Each experiment is started, selected, overlaped, count, get request data (4 times each)
        let total = data_query_id.length * experiments_name.length;
        progress_element.reset(total);
        let response = new rxjs_1.Subject();
        this.selectMultipleExperiments(experiments_name, progress_element).subscribe((selected_experiments) => {
            console.log("selectMultipleExperiments 2");
            this.intersectWithSelected(data_query_id, selected_experiments, progress_element).subscribe((overlap_ids) => {
                console.log("intersectWithSelected");
                this.countRegionsBatch(overlap_ids, progress_element).subscribe((datum) => {
                    console.log("FINISHED");
                    console.log(datum);
                    var end = new Date().getTime();
                    // Now calculate and output the difference
                    console.log(end - start);
                    response.next(datum);
                    response.complete();
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
