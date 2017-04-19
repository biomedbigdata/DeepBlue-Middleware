"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Observable_1 = require("rxjs/Observable");
const Subject_1 = require("rxjs/Subject");
const cache_1 = require("../service/cache");
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
                    var extra_metadata = JSON.parse(raw_value);
                    xmlrpc_request_parameters.push(extra_metadata);
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
        client.methodCall(this.name, xmlrpc_parameters, (error, value) => {
            subject.next(value);
            subject.complete();
        });
        return subject.asObservable();
    }
}
class DeepBlueService {
    constructor() {
        this.idNamesQueryCache = new cache_1.DataCache();
        this.intersectsQueryCache = new cache_1.MultiKeyDataCache();
        this.requestCache = new cache_1.DataCache();
        this.resultCache = new cache_1.DataCache();
    }
    init() {
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
        });
        return subject.asObservable();
    }
    execute(command_name, parameters, progress_element) {
        console.log(command_name);
        let command = this._commands[command_name];
        return command.makeRequest(parameters).map((body) => {
            let status = body[0];
            let response = body[1] || "";
            progress_element.increment();
            return [status, response];
        });
    }
    selectExperiment(experiment, progress_element) {
        console.log("selectExperiment", experiment);
        if (!experiment) {
            return Observable_1.Observable.empty();
        }
        console.log("selectExperiment - checking cache", experiment);
        if (this.idNamesQueryCache.get(experiment)) {
            console.log("selectExperiment - checking cache - has cache", experiment);
            progress_element.increment();
            let cached_operation = this.idNamesQueryCache.get(experiment);
            return Observable_1.Observable.of(cached_operation);
        }
        console.log("selectExperiment - not in cache", experiment);
        let params = new Object();
        params["experiment_name"] = experiment.name;
        return this.execute("select_experiments", params, progress_element).map((response) => {
            return new operations_1.DeepBlueOperation(experiment, response[1], "select_experiment");
        }).do((operation) => {
            this.idNamesQueryCache.put(experiment, operation);
        })
            .catch(this.handleError);
    }
    intersection(query_data_id, query_filter_id, progress_element) {
        let cache_key = [query_data_id, query_data_id];
        if (this.intersectsQueryCache.get(cache_key)) {
            progress_element.increment();
            let cached_operation = this.intersectsQueryCache.get(cache_key);
            return Observable_1.Observable.of(cached_operation);
        }
        let params = {};
        params["query_data_id"] = query_data_id.query_id;
        params["query_filter_id"] = query_filter_id.query_id;
        return this.execute("intersection", params, progress_element).map((response) => {
            return new operations_1.DeepBlueOperation(query_filter_id.data, response[1], "intersection");
        });
    }
    count_regions(op_exp, progress_element) {
        if (this.requestCache.get(op_exp)) {
            progress_element.increment();
            let cached_result = this.requestCache.get(op_exp);
            return this.getResult(cached_result, progress_element);
        }
        else {
            let params = new Object();
            params["query_id"] = op_exp.query_id;
            let request = this.execute("count_regions", params, progress_element).map((data) => {
                let request = new operations_1.DeepBlueRequest(op_exp.data, data[1], "count_regions", op_exp);
                this.requestCache.put(op_exp, request);
                return request;
            })
                .flatMap((request_id) => {
                return this.getResult(request_id, progress_element);
            });
            return request;
        }
    }
    getResult(op_request, progress_element) {
        if (this.resultCache.get(op_request)) {
            progress_element.increment();
            let cached_result = this.resultCache.get(op_request);
            return Observable_1.Observable.of(cached_result);
        }
        let params = new Object();
        params["request_id"] = op_request.request_id;
        let pollSubject = new Subject_1.Subject();
        let timer = Observable_1.Observable.timer(0, 250).concatMap(() => {
            return this.execute("get_request_data", params, progress_element).map((data) => {
                if (data[0] === "okay") {
                    progress_element.increment();
                    let op_result = new operations_1.DeepBlueResult(op_request.data, data, op_request);
                    this.resultCache.put(op_request, op_result);
                    timer.unsubscribe();
                    pollSubject.next(op_result);
                    pollSubject.complete();
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
