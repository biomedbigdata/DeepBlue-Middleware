"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Observable_1 = require("rxjs/Observable");
const rxjs_1 = require("rxjs");
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
    filterWithSelected(current_operations, filter, status) {
        let observableBatch = [];
        current_operations.forEach((current_op) => {
            let o = this.deepBlueService.filter_regions(current_op, filter, status);
            observableBatch.push(o);
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
    applyFilter(current_operations, filters, status) {
        if (filters.length == 0) {
            return Observable_1.Observable.of(current_operations);
        }
        else {
            let filter = filters.shift();
            let subject = new rxjs_1.Subject();
            this.filterWithSelected(current_operations, filter, status).subscribe((new_operation) => {
                return this.applyFilter(new_operation, filters, status).subscribe((queries_filtered) => {
                    subject.next(queries_filtered);
                    subject.complete();
                });
            });
            return subject.asObservable();
        }
    }
    countOverlaps(data_query_id, experiments_name, filters, status) {
        var start = new Date().getTime();
        let total = data_query_id.length * experiments_name.length * 4;
        status.reset(total);
        let response = new rxjs_1.Subject();
        status.setStep("Selecting experiments regions");
        this.selectMultipleExperiments(experiments_name, status).subscribe((selected_experiments) => {
            status.setStep("Overlaping regions");
            this.applyFilter(selected_experiments, filters, status).subscribe((filtered_data_id) => {
                this.intersectWithSelected(data_query_id, filtered_data_id, status).subscribe((overlap_ids) => {
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
    enrichRegionsGoTerms(data_query_id, gene_model, status) {
        var start = new Date().getTime();
        let total = data_query_id.length * data_query_id.length * 3;
        status.reset(total);
        let response = new rxjs_1.Subject();
        let observableBatch = [];
        data_query_id.forEach((current_op) => {
            let o = this.deepBlueService.enrich_regions_go_terms(current_op, gene_model, status);
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
