"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Observable_1 = require("rxjs/Observable");
const Subject_1 = require("rxjs/Subject");
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
    let cc = new ComposedCommands(dbs);
    let progress_bar = new progresselement_1.ProgressElement();
    let exp = new deepblue_2.IdName("e100269", "HSC_PB_I31_covg.bedgraph");
    let exp2 = new deepblue_2.IdName("e100270", "Bcell_PB_I53_fracmeth.bedgraph");
    let exp3 = new deepblue_2.IdName("e103786", "wgEncodeBroadHmmK562HMM");
    let exp4 = new deepblue_2.IdName("e103787", "wgEncodeBroadHmmNhekHMM");
    let exp5 = new deepblue_2.IdName("e103795", "E065_15_coreMarks_mnemonics.bed.bed");
    let exp6 = new deepblue_2.IdName("e103794", "wgEncodeBroadHmmGm12878HMM");
    let exp7 = new deepblue_2.IdName("e103795", "E065_15_coreMarks_mnemonics.bed.bed");
    let exp8 = new deepblue_2.IdName("e100277", "MK_BM_I22_covg.bedgraph");
    let ee = new deepblue_2.IdName("e100291", "HSC_PB_I30_covg.bedgraph");
    let ff = new deepblue_2.IdName("e100296", "RNA_D1_MLP0_100.wig");
    cc.countOverlaps([ff], [exp5, exp6, exp7, exp8, ee, ff]).subscribe((datum) => {
        console.log("FINISHED");
    });
});
class ComposedCommands {
    constructor(deepBlueService) {
        this.deepBlueService = deepBlueService;
    }
    selectMultipleExperiments(experiments, progress_element) {
        let observableBatch = [];
        experiments.forEach((experiment, key) => {
            console.log(experiment);
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
    countOverlaps(queries, experiments) {
        var start = new Date().getTime();
        let progress_element = new progresselement_1.ProgressElement();
        // Each experiment is started, selected, overlaped, count, get request data (4 times each)
        let total = queries.length * experiments.length;
        progress_element.reset(total);
        let response = new Subject_1.Subject();
        this.selectMultipleExperiments(queries, progress_element).subscribe((query_data) => {
            console.log("selectMultipleExperiments 1");
            this.selectMultipleExperiments(experiments, progress_element).subscribe((selected_experiments) => {
                console.log("selectMultipleExperiments 2");
                this.intersectWithSelected(query_data, selected_experiments, progress_element).subscribe((overlap_ids) => {
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
exports.default = composed_commands;
