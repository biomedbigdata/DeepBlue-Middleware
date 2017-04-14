import { Observable } from "rxjs/Observable";
import { Subscriber } from "rxjs/Subscriber";
import { Subject } from "rxjs/Subject";

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


  makeRequest(parameters: Object): Observable<Object[]> {
    let xmlrpc_parameters = this.build_xmlrpc_request(parameters);
    var client = xmlrpc.createClient(xmlrpc_host);
    var methodCall = Observable.bindCallback(client.methodCall);

    let subject: Subject<Object[]> = new Subject<Object[]>();
    client.methodCall(this.name, xmlrpc_parameters, (error: Object, value: any) => {
      subject.next(value);
    });

    return subject.asObservable();
  }
}


export class DeepBlueService {

  private _commands: Map<string, Command>;

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

  execute(command_name: string, parameters: Object): Observable<Object[]> {
    let command: Command = this._commands[command_name];
    console.log(command);
    return command.makeRequest(parameters);
  }
}
