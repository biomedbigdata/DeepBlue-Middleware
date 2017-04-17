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
                    console.log("Internal error: Unknown variables type ", parameter_type);
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
            console.log("COOOL");
            console.log(value);
            subject.next([value]);
            subject.next(["aaaaaaaa", "addadda"]);
            subject.next(["aaaaaaaa", "addadda"]);
            subject.complete();
        });
        return subject.asObservable();
    }
}
class DeepBlueService {
    constructor() {
        this.idNamesQueryCache = new cache_1.DataCache();
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
    execute(command_name, parameters) {
        let command = this._commands[command_name];
        console.log(command);
        return command.makeRequest(parameters);
    }
    selectExperiment(experiment, progress_element, request_count) {
        if (!experiment) {
            return Observable_1.Observable.empty();
        }
        if (this.idNamesQueryCache.get(experiment, request_count)) {
            console.log("selectExperiment hit");
            progress_element.increment(request_count);
            let cached_operation = this.idNamesQueryCache.get(experiment, request_count);
            return Observable_1.Observable.of(cached_operation);
        }
        let params = new Object();
        params["experiment_name"] = experiment.name;
        console.log(params);
        console.log("params");
        return this.execute("select_experiments", params).map((body) => {
            console.log("NOPPPP");
            let response = body[1] || "";
            progress_element.increment(request_count);
            console.log("123434444");
            console.log(response);
            return new operations_1.DeepBlueOperation(experiment, response, "select_experiment", request_count);
        }).do((operation) => {
            this.idNamesQueryCache.put(experiment, operation);
        })
            .catch(this.handleError);
    }
    handleError(error) {
        let errMsg;
        errMsg = error.message ? error.message : error.toString();
        console.log(errMsg);
        return Observable_1.Observable.throw(errMsg);
    }
}
exports.DeepBlueService = DeepBlueService;
