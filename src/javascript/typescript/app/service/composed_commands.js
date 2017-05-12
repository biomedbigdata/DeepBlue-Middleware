"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Observable_1 = require("rxjs/Observable");
const rxjs_1 = require("rxjs");
const deepblue_1 = require("../service/deepblue");
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
    selectMultipleExperiments(experiments, status) {
        let total = 0;
        let observableBatch = [];
        experiments.forEach((experiment) => {
            observableBatch.push(this.deepBlueService.selectExperiment(experiment, status));
        });
        return Observable_1.Observable.forkJoin(observableBatch);
    }
    intersectWithSelected(current_operations, selected_data, status) {
        let observableBatch = [];
        current_operations.forEach((current_op) => {
            selected_data.forEach((data) => {
                let o = this.deepBlueService.intersection(current_op, data, status);
                observableBatch.push(o);
            });
        });
        return Observable_1.Observable.forkJoin(observableBatch);
    }
    countRegionsBatch(query_ids, status) {
        let observableBatch = [];
        query_ids.forEach((op_exp, key) => {
            let o = new Observable_1.Observable((observer) => {
                this.deepBlueService.count_regions(op_exp, status).subscribe((result) => {
                    observer.next(result);
                    observer.complete();
                });
            });
            observableBatch.push(o);
        });
        return Observable_1.Observable.forkJoin(observableBatch);
    }
    countOverlaps(data_query_id, experiments_name, status) {
        var start = new Date().getTime();
        let total = data_query_id.length * experiments_name.length * 4;
        status.reset(total);
        let response = new rxjs_1.Subject();
        status.setStep("Selecting experiments regions");
        this.selectMultipleExperiments(experiments_name, status).subscribe((selected_experiments) => {
            status.setStep("Overlaping regions");
            this.intersectWithSelected(data_query_id, selected_experiments, status).subscribe((overlap_ids) => {
                status.setStep("Intersecting regions");
                this.countRegionsBatch(overlap_ids, status).subscribe((datum) => {
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
    countGenesOverlaps(data_query_id, gene_model, status) {
        var start = new Date().getTime();
        let total = data_query_id.length * data_query_id.length * 3;
        status.reset(total);
        let response = new rxjs_1.Subject();
        status.setStep("Selecting genes regions");
        this.deepBlueService.selectGenes(gene_model, status).subscribe((selected_genes) => {
            this.intersectWithSelected(data_query_id, [selected_genes], status).subscribe((overlap_ids) => {
                status.setStep("Intersecting regions");
                this.countRegionsBatch(overlap_ids, status).subscribe((datum) => {
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
    calculateEnrichment(data_query_id, gene_model, status) {
        var start = new Date().getTime();
        let total = data_query_id.length * data_query_id.length * 3;
        status.reset(total);
        let response = new rxjs_1.Subject();
        let observableBatch = [];
        data_query_id.forEach((current_op) => {
            let o = this.deepBlueService.calculate_enrichment(current_op, gene_model, status);
            observableBatch.push(o);
        });
        return Observable_1.Observable.forkJoin(observableBatch);
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
        return Observable_1.Observable.throw(errMsg);
    }
}
exports.ComposedCommands = ComposedCommands;
