"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Observable_1 = require("rxjs/Observable");
const Subject_1 = require("rxjs/Subject");
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
            subject.next(value);
        });
        return subject.asObservable();
    }
}
class DeepBlueService {
    constructor() { }
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
}
exports.DeepBlueService = DeepBlueService;
