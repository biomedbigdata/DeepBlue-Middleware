"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const Observable_1 = require("rxjs/Observable");
const Subject_1 = require("rxjs/Subject");
const cache_1 = require("../service/cache");
const deepblue_1 = require("../domain/deepblue");
const operations_1 = require("../domain/operations");
require("rxjs/Rx");
const xmlrpc = require("xmlrpc");
let settings = require('../../../settings');
let xmlrpc_host = settings.xmlrpc_host();
class Command {
    constructor(name, parameters) {
        this.name = name;
        this.parameters = parameters;
    }
    build_xmlrpc_request(values) {
        let xmlrpc_request_parameters = [];
        for (let pos in this.parameters) {
            var parameter = this.parameters[pos];
            var parameter_name = parameter[0];
            var parameter_type = parameter[1];
            var multiple = parameter[2];
            if (parameter_name in values) {
                var raw_value = values[parameter_name];
                if (parameter_type == "string") {
                    xmlrpc_request_parameters.push(raw_value);
                }
                else if (parameter_type == "int") {
                    xmlrpc_request_parameters.push(parseInt(raw_value));
                }
                else if (parameter_type == "double") {
                    xmlrpc_request_parameters.push(parseFloat(raw_value));
                }
                else if (parameter_type == "struct") {
                    xmlrpc_request_parameters.push(raw_value);
                }
                else if (parameter_type == "boolean") {
                    var bool_value = raw_value == "true";
                    xmlrpc_request_parameters.push(bool_value);
                }
                else {
                    console.error("Internal error: Unknown variables type ", parameter_type);
                    return;
                }
            }
            else {
                if (parameter_name == "user_key") {
                    xmlrpc_request_parameters.push("anonymous_key");
                }
                else {
                    xmlrpc_request_parameters.push(null);
                }
            }
        }
        return xmlrpc_request_parameters;
    }
    makeRequest(parameters) {
        let xmlrpc_parameters = this.build_xmlrpc_request(parameters);
        var client = xmlrpc.createClient(xmlrpc_host);
        var methodCall = Observable_1.Observable.bindCallback(client.methodCall);
        let subject = new Subject_1.Subject();
        client.methodCall(this.name, xmlrpc_parameters, (err, value) => {
            if (err) {
                console.error(this.name, xmlrpc_parameters, err);
                return;
            }
            subject.next(value);
            subject.complete();
        });
        return subject.asObservable();
    }
}
class DeepBlueService {
    constructor(initalized = false) {
        this.initalized = initalized;
        this.IdObjectCache = new cache_1.DataCache();
        this.idNamesQueryCache = new cache_1.DataCache();
        this.intersectsQueryCache = new cache_1.MultiKeyDataCache();
        this.resultCache = new cache_1.DataCache();
    }
    init() {
        if (this.isInitialized()) {
            return Observable_1.Observable.of(true);
        }
        let client = xmlrpc.createClient(xmlrpc_host);
        let subject = new Subject_1.Subject();
        client.methodCall("commands", [], (error, value) => {
            let commands = value[1];
            for (let command_name in commands) {
                let command = new Command(command_name, commands[command_name]["parameters"]);
                commands[command_name] = command;
            }
            this._commands = commands;
            subject.next(true);
            subject.complete();
            this.initalized = true;
        });
        return subject.asObservable();
    }
    isInitialized() {
        return this.initalized;
    }
    execute(command_name, parameters, status) {
        let command = this._commands[command_name];
        return command.makeRequest(parameters).map((body) => {
            let command_status = body[0];
            let status_result;
            if (command_status == "error") {
                status_result = operations_1.DeepBlueResultStatus.Error;
            }
            else {
                status_result = operations_1.DeepBlueResultStatus.Okay;
            }
            let response = body[1] || "";
            if (command_status === "error") {
                console.error(command_name, parameters, response);
            }
            return [status_result, response];
        });
    }
    selectExperiment(experiment, status) {
        if (!experiment) {
            return Observable_1.Observable.empty();
        }
        let cached_operation = this.idNamesQueryCache.get(experiment);
        if (cached_operation) {
            status.increment();
            return Observable_1.Observable.of(cached_operation);
        }
        let params = new Object();
        params["experiment_name"] = experiment.name;
        return this.execute("select_experiments", params, status).map((response) => {
            status.increment();
            return new operations_1.DeepBlueOperation(new operations_1.DeepBlueDataParameter(experiment), new deepblue_1.Id(response[1]), "select_experiment");
        }).do((operation) => {
            this.idNamesQueryCache.put(experiment, operation);
        }).catch(this.handleError);
    }
    select_regions_from_metadata(genome, type, epigenetic_mark, biosource, sample, technique, project, status) {
        const params = new operations_1.DeepBlueMetadataParameters(genome, type, epigenetic_mark, biosource, sample, technique, project);
        return this.execute("select_regions", params, status).map((response) => {
            status.increment();
            return new operations_1.DeepBlueOperation(params, new deepblue_1.Id(response[1]), "select_regions_from_metadata");
        }).catch(this.handleError);
    }
    filter_regions(query_op, filter, status) {
        let params = filter.asKeyValue();
        params["query_id"] = query_op.id().id;
        return this.execute("filter_regions", params, status).map((response) => {
            return new operations_1.DeepBlueFilter(query_op, filter, new deepblue_1.Id(response[1]));
        }).catch(this.handleError);
    }
    flank(query_op, start, length, status) {
        let params = new Object();
        params["query_id"] = query_op.id().id;
        params["start"] = start;
        params["length"] = length;
        params["use_strand"] = "true";
        return this.execute("flank", params, status).map((response) => {
            status.increment();
            let args = new operations_1.DeepBlueOperationArgs(params);
            return new operations_1.DeepBlueFlank(query_op, args, new deepblue_1.Id(response[1]));
        }).catch(this.handleError);
    }
    extend(query_op, length, direction, status) {
        let params = new Object();
        params["query_id"] = query_op.id().id;
        params["length"] = length;
        params["direction"] = direction;
        params["use_strand"] = "true";
        return this.execute("extend", params, status).map((response) => {
            status.increment();
            let args = new operations_1.DeepBlueOperationArgs(params);
            return new operations_1.DeepBlueExtend(query_op, args, new deepblue_1.Id(response[1]));
        }).catch(this.handleError);
    }
    query_cache(query_data, status) {
        let params = new Object();
        params["query_id"] = query_data.id().id;
        params["cache"] = "true";
        return this.execute("query_cache", params, status).map((response) => {
            status.increment();
            return query_data.cacheIt(new deepblue_1.Id(response[1]));
        }).catch(this.handleError);
    }
    selectGenes(gene_model_name, status) {
        let cached_operation = this.idNamesQueryCache.get(gene_model_name);
        if (cached_operation) {
            status.increment();
            return Observable_1.Observable.of(cached_operation);
        }
        const params = new Object();
        params['gene_model'] = gene_model_name.name;
        return this.execute("select_genes", params, status).map((response) => {
            status.increment();
            return new operations_1.DeepBlueOperation(new operations_1.DeepBlueOperationArgs({ "gene_model": gene_model_name }), new deepblue_1.Id(response[1]), 'select_genes');
        }).do((operation) => {
            this.idNamesQueryCache.put(gene_model_name, operation);
        }).catch(this.handleError);
    }
    intersection(query_data, query_filter, status) {
        let cache_key = [query_data, query_filter];
        let cached_intersection = this.intersectsQueryCache.get(cache_key);
        if (cached_intersection) {
            status.increment();
            return Observable_1.Observable.of(cached_intersection);
        }
        let params = {};
        params["query_data_id"] = query_data.id().id;
        params["query_filter_id"] = query_filter.id().id;
        return this.execute("intersection", params, status)
            .map((response) => {
            status.increment();
            return new operations_1.DeepBlueIntersection(query_data, query_filter, true, new deepblue_1.Id(response[1]));
        })
            .do((operation) => this.intersectsQueryCache.put(cache_key, operation))
            .catch(this.handleError);
    }
    count_regions(op_exp, status) {
        let params = new Object();
        params["query_id"] = op_exp.id().id;
        return this.execute("count_regions", params, status).map((data) => {
            let request = new operations_1.DeepBlueRequest(op_exp, new deepblue_1.Id(data[1]), "count_regions");
            return request;
        }).flatMap((request) => {
            return this.getResult(request, status);
        });
    }
    getRegions(op_exp, output_format, status) {
        const params = new Object();
        params["query_id"] = op_exp.id().id;
        params["output_format"] = output_format;
        return this.execute("get_regions", params, status).map((data) => {
            status.increment();
            return new operations_1.DeepBlueRequest(op_exp, new deepblue_1.Id(data[1]), "get_regions");
        }).catch(this.handleError);
    }
    distinct_column_values(data, field, status) {
        const params = new Object();
        params['query_id'] = data.id().id;
        params['field'] = field;
        return this.execute("distinct_column_values", params, status).map((response) => {
            status.increment();
            return new operations_1.DeepBlueRequest(data, new deepblue_1.Id(response[1]), 'distinct_column_values');
        }).flatMap((request_id) => {
            return this.getResult(request_id, status);
        }).catch(this.handleError);
    }
    enrich_regions_go_terms(data, gene_model_name, status) {
        const params = new Object();
        params['query_id'] = data.id().id;
        params['gene_model'] = gene_model_name.name;
        return this.execute("enrich_regions_go_terms", params, status).map((response) => {
            status.increment();
            return new operations_1.DeepBlueRequest(data, new deepblue_1.Id(response[1]), 'enrich_regions_go_terms');
        }).flatMap((request_id) => {
            return this.getResult(request_id, status);
        }).catch(this.handleError);
    }
    enrich_regions_overlap(data, genome, universe_id, datasets, status) {
        const params = new Object();
        params['query_id'] = data.id().id;
        params['background_query_id'] = universe_id;
        params['datasets'] = datasets;
        params["genome"] = genome;
        return this.execute("enrich_regions_overlap", params, status).map((response) => {
            status.increment();
            return new operations_1.DeepBlueRequest(data, new deepblue_1.Id(response[1]), 'enrich_regions_overlap');
        }).flatMap((request_id) => {
            return this.getResult(request_id, status);
        }).catch(this.handleError);
    }
    enrich_regions_fast(data, genome, filter, status) {
        const params = new Object();
        params['query_id'] = data.id().id;
        params['genome'] = genome;
        for (let o of Object.keys(filter)) {
            params[o] = filter[o];
        }
        status.increment();
        return this.execute("enrich_regions_fast", params, status).map((response) => {
            return new operations_1.DeepBlueRequest(data, new deepblue_1.Id(response[1]), 'enrich_regions_fast');
        }).flatMap((request_id) => {
            return this.getResult(request_id, status);
        }).catch(this.handleError);
    }
    list_epigenetic_marks(status, type) {
        const params = new Object();
        if (type) {
            params["extra_metadata"] = { "type": type };
        }
        return this.execute("list_epigenetic_marks", params, status).map((response) => {
            const data = response[1] || [];
            return data.map((value) => {
                return new deepblue_1.GeneModel(value);
            }).sort((a, b) => a.name.localeCompare(b.name));
        });
    }
    collection_experiments_count(status, controlled_vocabulary, type, genome, technique) {
        const params = new Object();
        params["controlled_vocabulary"] = controlled_vocabulary;
        if (type) {
            params["type"] = type;
        }
        if (genome) {
            params["genome"] = genome;
        }
        if (technique) {
            params["technique"] = technique;
        }
        return this.execute("collection_experiments_count", params, status).map((response) => {
            const data = response[1] || [];
            return data.map((value) => {
                return new deepblue_1.IdNameCount(new deepblue_1.Id(value[0]), value[1], value[2]);
            }).sort((a, b) => a.name.localeCompare(b.name));
        });
    }
    list_experiments(status, type, epigenetic_mark, genome) {
        const params = new Object();
        if (type) {
            params["type"] = type;
        }
        if (epigenetic_mark) {
            params["epigenetic_mark"] = epigenetic_mark;
        }
        if (genome) {
            params["genome"] = genome;
        }
        return this.execute("list_experiments", params, status).map((response) => {
            const data = response[1] || [];
            return data.map((value) => {
                return new deepblue_1.Experiment(value);
            }).sort((a, b) => a.name.localeCompare(b.name));
        });
    }
    list_experiments_full(status, type, epigenetic_mark, genome) {
        return this.list_experiments(status, type, epigenetic_mark, genome).flatMap((ids) => this.infos(ids, status));
    }
    get_biosource_related(biosource, status) {
        const params = new Object();
        params["biosource"] = biosource;
        return this.execute("get_biosource_related", params, status).map((response) => new operations_1.DeepBlueCommandExecutionResult(response[0], response[1]));
    }
    get_biosource_children(biosource, status) {
        const params = new Object();
        params["biosource"] = biosource;
        return this.execute("get_biosource_children", params, status).map((response) => new operations_1.DeepBlueCommandExecutionResult(response[0], response[1]));
    }
    get_biosource_synonyms(biosource, status) {
        const params = new Object();
        params["biosource"] = biosource;
        return this.execute("get_biosource_synonyms", params, status).map((response) => new operations_1.DeepBlueCommandExecutionResult(response[0], response[1]));
    }
    list_gene_models(status) {
        const params = new Object();
        return this.execute("list_gene_models", params, status).map((response) => {
            const data = response[1] || [];
            return data.map((value) => {
                return new deepblue_1.GeneModel(value);
            }).sort((a, b) => a.name.localeCompare(b.name));
        });
    }
    list_genes(gene_model, status) {
        let gene_model_name = "";
        if (gene_model instanceof deepblue_1.GeneModel) {
            gene_model_name = gene_model.name;
        }
        else {
            gene_model_name = gene_model;
        }
        const params = new Object();
        params["gene_model"] = gene_model_name;
        return this.execute("list_genes", params, status).map((response) => {
            const data = response[1] || [];
            return data.map((value) => {
                return new deepblue_1.Gene(value);
            }).sort((a, b) => a.name.localeCompare(b.name));
        });
    }
    nameToId(name, collection, status) {
        let params = {
            "name": name,
            "collection": collection
        };
        return this.execute('name_to_id', params, status).map((body) => {
            const data = body[1] || [];
            return data.map((value) => {
                return new deepblue_1.IdName(new deepblue_1.Id(value[0]), value[1]);
            });
        });
    }
    info(id, status) {
        let object = this.IdObjectCache.get(id);
        if (object) {
            status.increment();
            return Observable_1.Observable.of(object);
        }
        const params = new Object();
        params["id"] = id.id;
        return this.execute("info", params, status).map((response) => {
            return new deepblue_1.FullMetadata(response[1][0]);
        })
            .do((info_object) => {
            this.IdObjectCache.put(id, info_object);
        });
    }
    infos(id_names, status) {
        let total = 0;
        let observableBatch = [];
        id_names.forEach((id_name) => {
            observableBatch.push(this.info(id_name.id, status));
        });
        return Observable_1.Observable.forkJoin(observableBatch);
    }
    inputRegions(genome, region_set, status) {
        const params = new Object();
        params['genome'] = genome.name;
        params['region_set'] = region_set;
        return this.execute("input_regions", params, status).map((response) => {
            status.increment();
            if (response[0] == "okay") {
                return new operations_1.DeepBlueOperation(new operations_1.DeepBlueEmptyParameter(), new deepblue_1.Id(response[1]), 'input_regions');
            }
            else {
                return new operations_1.DeepBlueOperationError(response[1]);
            }
        }).catch(this.handleError);
    }
    cancelRequest(id, status) {
        const params = new Object();
        params['id'] = id.id;
        return this.execute("cancel_request", params, status).map((response) => {
            return response;
        }).catch(this.handleError);
    }
    getResult(op_request, status) {
        let result = this.resultCache.get(op_request);
        if (result) {
            return Observable_1.Observable.of(result);
        }
        let params = new Object();
        params["request_id"] = op_request._id.id;
        let pollSubject = new Subject_1.Subject();
        let isProcessing = false;
        let timer = Observable_1.Observable.timer(0, utils_1.Utils.rnd(500, 1000)).do(() => {
            if (isProcessing) {
                return;
            }
            isProcessing = true;
            if (status.canceled) {
                this.cancelRequest(op_request._id, status).subscribe((id) => {
                    isProcessing = false;
                    let op_result = new operations_1.DeepBlueResultError(op_request, "Canceled by user");
                    timer.unsubscribe();
                    pollSubject.next(op_result);
                    pollSubject.complete();
                });
                return;
            }
            this.execute("info", { "id": op_request._id.id }, status).subscribe((info) => {
                let state = info[1][0]['state'];
                if (state == "done") {
                    let client = xmlrpc.createClient(xmlrpc_host);
                    client.methodCall("get_request_data", [op_request._id.id, 'anonymous_key'], (err, value) => {
                        if (err) {
                            console.error(err);
                            isProcessing = false;
                            return;
                        }
                        if (value[0] === "okay") {
                            let op_result = new operations_1.DeepBlueResult(op_request, value[1]);
                            this.resultCache.put(op_request, op_result);
                            status.increment();
                            timer.unsubscribe();
                            pollSubject.next(op_result);
                            pollSubject.complete();
                        }
                        else {
                            isProcessing = false;
                        }
                    });
                }
                else if (state == "error") {
                    let message = info[1][0]['message'];
                    let op_result = new operations_1.DeepBlueResultError(op_request, message);
                    this.resultCache.put(op_request, op_result);
                    timer.unsubscribe();
                    pollSubject.next(op_result);
                    pollSubject.complete();
                }
                else if (state == "removed" || state == "canceled") {
                    let client = xmlrpc.createClient(xmlrpc_host);
                    client.methodCall("reprocess", [op_request._id.id, 'anonymous_key'], (err, value) => {
                        console.info("Reprocessed", value);
                    });
                    isProcessing = false;
                }
                else {
                    isProcessing = false;
                }
            });
        }).subscribe();
        return pollSubject.asObservable();
    }
    handleError(error) {
        let errMsg;
        errMsg = error.message ? error.message : error.toString();
        console.error(errMsg);
        return Observable_1.Observable.throw(errMsg);
    }
}
exports.DeepBlueService = DeepBlueService;
