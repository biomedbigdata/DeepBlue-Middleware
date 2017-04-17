import { Observable } from "rxjs/Observable";
import { Subscriber } from "rxjs/Subscriber";
import { Subject } from "rxjs/Subject";

import { DataCache } from '../service/cache';

import { IdName } from '../domain/deepblue'
import { DeepBlueOperation } from '../domain/operations'

import { ProgressElement } from '../service/progresselement';


import 'rxjs/Rx';

import * as xmlrpc from 'xmlrpc';

let settings = require('../../../settings');
let xmlrpc_host = settings.xmlrpc_host();

class Command {
  constructor(public name: string, public parameters: Object[]) { }

  build_xmlrpc_request(values: Object): Object[] {

    let xmlrpc_request_parameters: Object[] = [];

    for (let pos in this.parameters) {
      var parameter = this.parameters[pos];
      var parameter_name = parameter[0];
      var parameter_type = parameter[1];
      var multiple = parameter[2];

      if (parameter_name in values) {
        var raw_value = values[parameter_name];
        if (parameter_type == "string") {
          xmlrpc_request_parameters.push(raw_value);
        } else if (parameter_type == "int") {
          xmlrpc_request_parameters.push(parseInt(raw_value));
        } else if (parameter_type == "double") {
          xmlrpc_request_parameters.push(parseFloat(raw_value));
        } else if (parameter_type == "struct") {
          var extra_metadata = JSON.parse(raw_value);
          xmlrpc_request_parameters.push(extra_metadata);
        } else if (parameter_type == "boolean") {
          var bool_value = raw_value == "true";
          xmlrpc_request_parameters.push(bool_value);
        } else {
          console.log("Internal error: Unknown variables type ", parameter_type);
          return;
        }
      } else {
        if (parameter_name == "user_key") {
          xmlrpc_request_parameters.push("anonymous_key");
        } else {
          xmlrpc_request_parameters.push(null);
        }
      }
    }
    return xmlrpc_request_parameters;
  }


  makeRequest(parameters: Object): Observable<string[]> {
    let xmlrpc_parameters = this.build_xmlrpc_request(parameters);
    var client = xmlrpc.createClient(xmlrpc_host);
    var methodCall = Observable.bindCallback(client.methodCall);

    let subject: Subject<string[]> = new Subject<string[]>();
    client.methodCall(this.name, xmlrpc_parameters, (error: Object, value: any) => {
      console.log("COOOL");
      console.log(value)
      subject.next([value]);
      subject.next(["aaaaaaaa", "addadda"]);
      subject.next(["aaaaaaaa", "addadda"]);
      subject.complete();
    });

    return subject.asObservable();
  }
}


export class DeepBlueService {

  private _commands: Map<string, Command>;

  idNamesQueryCache: DataCache<IdName, DeepBlueOperation> = new DataCache<IdName, DeepBlueOperation>();


  constructor() { }

  public init(): Observable<boolean> {
    let client = xmlrpc.createClient(xmlrpc_host);
    let subject: Subject<boolean> = new Subject<boolean>();

    client.methodCall("commands", [], (error: Object, value: any) => {
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

  execute(command_name: string, parameters: Object): Observable<string[]> {
    let command: Command = this._commands[command_name];
    console.log(command);
    return command.makeRequest(parameters);
  }

  selectExperiment(experiment: IdName, progress_element: ProgressElement, request_count: number): Observable<DeepBlueOperation> {
    if (!experiment) {
      return Observable.empty<DeepBlueOperation>();
    }

    if (this.idNamesQueryCache.get(experiment, request_count)) {
      console.log("selectExperiment hit");
      progress_element.increment(request_count);
      let cached_operation = this.idNamesQueryCache.get(experiment, request_count);
      return Observable.of(cached_operation);
    }

    let params: Object = new Object();
    params["experiment_name"] = experiment.name;
    console.log(params);
    console.log("params");
    return this.execute("select_experiments", params).map((body: string[]) => {
      console.log("NOPPPP");
      let response: string = body[1] || "";
      progress_element.increment(request_count);
      console.log("123434444");
      console.log(response);
      return new DeepBlueOperation(experiment, response, "select_experiment", request_count);
    }).do((operation) => {
      this.idNamesQueryCache.put(experiment, operation)
    })
      .catch(this.handleError);
  }

  private handleError(error: Response | any) {
    let errMsg: string;
    errMsg = error.message ? error.message : error.toString();
    console.log(errMsg);
    return Observable.throw(errMsg);
  }

}
