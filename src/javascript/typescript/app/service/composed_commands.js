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
                    status.addPartialData(result);
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
    countGenesOverlaps(data_query_id, gene_model, filters, status) {
        var start = new Date().getTime();
        let total = data_query_id.length * data_query_id.length * 3;
        status.reset(total);
        filters.unshift({});
        status.setStep("Selecting genes regions");
        return this.deepBlueService.selectGenes(gene_model, status).flatMap((selected_genes) => {
            let observableCounts = new Array();
            for (let filter of filters) {
                let modificator = Observable_1.Observable.of(selected_genes);
                if (filter.type == "flank") {
                    modificator = this.deepBlueService.flank(selected_genes, filter.start, filter.length, status);
                }
                else if (filter.type == "extend") {
                    modificator = this.deepBlueService.extend(selected_genes, filter.length, filter.direction, status);
                }
                let obs = modificator.flatMap((modified_genes) => {
                    return this.intersectWithSelected(data_query_id, [modified_genes], status).flatMap((overlap_ids) => this.countRegionsBatch(overlap_ids, status));
                });
                observableCounts.push(obs);
            }
            return Observable_1.Observable.forkJoin(observableCounts);
        });
    }
    loadQuery(query_id, status) {
        return this.deepBlueService.info(query_id, status).map((fullMetadata) => {
            let type = fullMetadata.type();
            let id = fullMetadata.id;
            let name = fullMetadata.name;
            let content;
            if (name) {
                content = new operations_1.DeepBlueDataParameter(new deepblue_1.Name(name));
            }
            else {
                content = new operations_1.DeepBlueOperationArgs(fullMetadata.get('args'));
            }
            switch (type) {
                case "annotation_select":
                case "experiment_select":
                case "genes_select":
                case 'find_motif':
                case "input_regions": {
                    return Observable_1.Observable.of(new operations_1.DeepBlueOperation(content, id, type));
                }
                case "filter": {
                    let filter_parameters = operations_1.DeepBlueFilterParameters.fromObject(fullMetadata['values']['args']);
                    let _query = new deepblue_1.Id(fullMetadata.get('args')['query']);
                    return this.loadQuery(_query, status).flatMap((op) => {
                        return Observable_1.Observable.of(new operations_1.DeepBlueFilter(op, filter_parameters, query_id));
                    });
                }
                case "tiling": {
                    let genome = fullMetadata.get('args')['genome'];
                    let size = Number(fullMetadata.get('args')['size']);
                    let chromosomes = fullMetadata.get('args')['chromosomes'];
                    return Observable_1.Observable.of(new operations_1.DeepBlueTiling(size, genome, chromosomes, id));
                }
                case "intersect":
                case "overlap": {
                    let data = new deepblue_1.Id(fullMetadata.get('args')['qid_1']);
                    let filter = new deepblue_1.Id(fullMetadata.get('args')['qid_2']);
                    return Observable_1.Observable.forkJoin([
                        this.loadQuery(data, status),
                        this.loadQuery(filter, status)
                    ]).map(([op_data, op_filter]) => {
                        return new operations_1.DeepBlueIntersection(op_data, op_filter, true, id);
                    });
                }
                case "aggregate": {
                    let data_id = new deepblue_1.Id(fullMetadata.get('args')['data_id']);
                    let ranges_id = new deepblue_1.Id(fullMetadata.get('args')['ranges_id']);
                    let field = fullMetadata.get('args')['field'];
                    return Observable_1.Observable.forkJoin([
                        this.loadQuery(data_id, status),
                        this.loadQuery(ranges_id, status)
                    ]).map(([op_data, op_ranges]) => {
                        return new operations_1.DeepBlueAggregate(op_data, op_ranges, field, id);
                    });
                }
                case "flank":
                case 'extend': {
                    let args = operations_1.DeepBlueOperationArgs.fromObject(fullMetadata.get('args'));
                    let _data = new deepblue_1.Id(fullMetadata.get('args')['query_id']);
                    return this.loadQuery(_data, status).flatMap((op) => {
                        if (type == "flank") {
                            return Observable_1.Observable.of(new operations_1.DeepBlueFlank(op, args, query_id));
                        }
                        else if (type == "extend") {
                            return Observable_1.Observable.of(new operations_1.DeepBlueExtend(op, args, query_id));
                        }
                        else {
                            console.log("Unknow type", type);
                            return Observable_1.Observable.of(null);
                        }
                    });
                }
                default: {
                    console.error("Invalid type ", type, " at ", JSON.stringify(fullMetadata));
                    return Observable_1.Observable.of(new operations_1.DeepBlueOperation(new operations_1.DeepBlueDataParameter(name), id, type));
                }
            }
        }).flatMap((o) => o);
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
