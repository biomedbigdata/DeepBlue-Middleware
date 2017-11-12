"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Observable_1 = require("rxjs/Observable");
const rxjs_1 = require("rxjs");
const deepblue_1 = require("../domain/deepblue");
const operations_1 = require("../domain/operations");
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
    countRegionsBatch(query_ops, status) {
        let observableBatch = [];
        query_ops.forEach((op_exp, key) => {
            let o = new Observable_1.Observable((observer) => {
                this.deepBlueService.count_regions(op_exp, status).subscribe((result) => {
                    let overlapResult = new operations_1.DeepBlueMiddlewareOverlapResult(result.getDataName(), result.getDataId(), result.getFilterName(), result.getFilterQuery(), result.resultAsCount());
                    status.addPartialData(overlapResult);
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
            this.applyFilter(selected_experiments, filters, status).subscribe((filtered_data) => {
                this.intersectWithSelected(data_query_id, filtered_data, status).subscribe((overlap_ops) => {
                    status.setStep("Intersecting regions");
                    this.countRegionsBatch(overlap_ops, status).subscribe((datum) => {
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
    loadQuery(query_id, status) {
        let querySubject = new rxjs_1.Subject();
        this.deepBlueService.info(query_id, status).subscribe((fullMetadata) => {
            let type = fullMetadata.type();
            let id = new deepblue_1.Id(fullMetadata.id);
            let name = fullMetadata.name;
            let content;
            if (name) {
                content = new deepblue_1.Name(name);
            }
            else {
                content = new operations_1.DeepBlueArgs(fullMetadata.values['args']);
            }
            switch (type) {
                case "annotation_select": {
                    querySubject.next(new operations_1.DeepBlueSelectData(new deepblue_1.Name(name), id, type));
                    querySubject.complete();
                    break;
                }
                case "experiment_select": {
                    querySubject.next(new operations_1.DeepBlueSelectData(content, id, type));
                    querySubject.complete();
                    break;
                }
                case "genes_select": {
                    querySubject.next(new operations_1.DeepBlueSelectData(new deepblue_1.Name(fullMetadata.values['genes']), id, type));
                    querySubject.complete();
                    break;
                }
                case "intersect":
                case "overlap": {
                    let data = new deepblue_1.Id(fullMetadata.values['qid_1']);
                    let filter = new deepblue_1.Id(fullMetadata.values['qid_1']);
                    Observable_1.Observable.forkJoin(this.loadQuery(data, status), this.loadQuery(filter, status))
                        .subscribe(([op_data, op_filter]) => {
                        querySubject.next(new operations_1.DeepBlueIntersection(op_data, op_filter, id));
                        querySubject.complete();
                    });
                    break;
                }
                case "filter": {
                    let filter_parameters = operations_1.FilterParameter.fromObject(fullMetadata['values']['args']);
                    let query_id = new deepblue_1.Id(fullMetadata.values['args']['query']);
                    this.loadQuery(query_id, status).subscribe((op) => {
                        querySubject.next(new operations_1.DeepBlueFilter(op, filter_parameters, query_id));
                        querySubject.complete();
                    });
                    break;
                }
                case "tiling": {
                    let genome = fullMetadata.values['genome'];
                    let size = Number(fullMetadata.values['size']);
                    querySubject.next(new operations_1.DeepBlueTilingRegions(size, genome, id));
                    querySubject.complete();
                    break;
                }
                default: {
                    console.error("Invalid type", type);
                    return new operations_1.DeepBlueSelectData(new deepblue_1.Name("name"), id, type);
                }
            }
        });
        return querySubject.asObservable();
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
