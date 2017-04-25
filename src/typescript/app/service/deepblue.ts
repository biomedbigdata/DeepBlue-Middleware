import { Utils } from './utils';
import { Observable } from "rxjs/Observable";
import { Subscriber } from "rxjs/Subscriber";
import { Subject } from "rxjs/Subject";

import { DataCache, MultiKeyDataCache } from '../service/cache';

import { IdName, Name } from '../domain/deepblue';
import {
  DeepBlueIntersection,
  DeepBlueOperation,
  DeepBlueRequest,
  DeepBlueResult,
  DeepBlueSelectData
} from '../domain/operations';

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
          console.error("Internal error: Unknown variables type ", parameter_type);
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

    let isProcessing = false;

    let timer = Observable.timer(0, Utils.rnd(0, 250)).do(() => {
      if (isProcessing) {
        return;
      }
      isProcessing = true;
      client.methodCall(this.name, xmlrpc_parameters, (err: Object, value: any) => {
        if (err) {
          console.error(this.name, xmlrpc_parameters, err);
          isProcessing = false;
          return;
        }
        subject.next(value);
        subject.complete();
        isProcessing = false;
        timer.unsubscribe();
      });
    }).subscribe();

    return subject.asObservable();
  }
}

export class DeepBlueService {

  private _commands: Map<string, Command>;

  idNamesQueryCache = new DataCache<Name, DeepBlueOperation>();
  intersectsQueryCache = new MultiKeyDataCache<DeepBlueOperation, DeepBlueIntersection>();
  requestCache = new DataCache<DeepBlueOperation, DeepBlueRequest>();
  resultCache = new DataCache<DeepBlueRequest, DeepBlueResult>()

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

  execute(command_name: string, parameters: Object,
    progress_element: ProgressElement): Observable<[string | any]> {

    let command: Command = this._commands[command_name];
    return command.makeRequest(parameters).map((body: string[]) => {
      let status: string = body[0];
      let response: any = body[1] || "";
      progress_element.increment();
      return [status, response];
    });
  }

  selectExperiment(experiment: Name, progress_element: ProgressElement): Observable<DeepBlueOperation> {
    if (!experiment) {
      return Observable.empty<DeepBlueOperation>();
    }

    if (this.idNamesQueryCache.get(experiment)) {
      progress_element.increment();
      let cached_operation = this.idNamesQueryCache.get(experiment);
      return Observable.of(cached_operation);
    }

    let params: Object = new Object();
    params["experiment_name"] = experiment.name;

    return this.execute("select_experiments", params, progress_element).map((response: [string, any]) => {
      return new DeepBlueSelectData(experiment, response[1], "select_experiment");
    }).do((operation) => {
      this.idNamesQueryCache.put(experiment, operation);
    })
      .catch(this.handleError);
  }

  intersection(query_data_id: DeepBlueOperation, query_filter_id: DeepBlueOperation,
    progress_element: ProgressElement): Observable<DeepBlueIntersection> {

    let cache_key = [query_data_id, query_filter_id];

    if (this.intersectsQueryCache.get(cache_key)) {
      progress_element.increment();
      let cached_intersection = this.intersectsQueryCache.get(cache_key);
      return Observable.of(cached_intersection);
    }

    let params = {};
    params["query_data_id"] = query_data_id.queryId();
    params["query_filter_id"] = query_filter_id.queryId();
    return this.execute("intersection", params, progress_element)
      .map((response: [string, any]) => {
        return new DeepBlueIntersection(query_data_id, query_filter_id, response[1])
      })
      .do((operation: DeepBlueIntersection) => this.intersectsQueryCache.put(cache_key, operation))
      .catch(this.handleError);
  }

  count_regions(op_exp: DeepBlueOperation, progress_element: ProgressElement): Observable<DeepBlueResult> {
    if (this.requestCache.get(op_exp)) {
      progress_element.increment();
      let cached_result = this.requestCache.get(op_exp);
      return this.getResult(cached_result, progress_element);

    } else {
      let params = new Object();
      params["query_id"] = op_exp.queryId();

      let request: Observable<DeepBlueResult> = this.execute("count_regions", params, progress_element).map((data: [string, any]) => {
        let request = new DeepBlueRequest(op_exp, data[1], "count_regions");
        this.requestCache.put(op_exp, request);
        return request;
      })
        .flatMap((request_id) => {
          return this.getResult(request_id, progress_element);
        })

      return request;
    }
  }

  getResult(op_request: DeepBlueRequest, progress_element: ProgressElement): Observable<DeepBlueResult> {
    if (this.resultCache.get(op_request)) {
      progress_element.increment();
      let cached_result = this.resultCache.get(op_request);
      return Observable.of(cached_result);
    }

    let params = new Object();
    params["request_id"] = op_request.request_id;

    let pollSubject = new Subject<DeepBlueResult>();
    let client = xmlrpc.createClient(xmlrpc_host);

    let isProcessing = false;

    let timer = Observable.timer(0, Utils.rnd(0, 500)).do(() => {
      if (isProcessing) {
        return;
      }
      isProcessing = true;
      client.methodCall("get_request_data", [op_request.request_id, 'anonymous_key'], (err: Object, value: any) => {
        if (err) {
          console.error(err);
          isProcessing = false;
          return;
        }

        if (value[0] === "okay") {
          progress_element.increment();
          let op_result = new DeepBlueResult(op_request, value[1]);
          this.resultCache.put(op_request, op_result)
          timer.unsubscribe();
          pollSubject.next(op_result);
          pollSubject.complete();
        } else {
          isProcessing = false;
        }

      });
    }).subscribe();

    return pollSubject.asObservable();
  }

  private handleError(error: Response | any) {
    let errMsg: string;
    errMsg = error.message ? error.message : error.toString();
    console.error(errMsg);
    return Observable.throw(errMsg);
  }

}
