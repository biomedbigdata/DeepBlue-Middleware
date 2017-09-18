import { RequestStatus } from '../domain/status';
import { Utils } from './utils';
import { Observable } from "rxjs/Observable";
import { Subscriber } from "rxjs/Subscriber";
import { Subject } from "rxjs/Subject";

import { DataCache, MultiKeyDataCache } from '../service/cache';

import {
  Experiment,
  FullGeneModel,
  FullMetadata,
  GeneModel,
  IdName,
  Name,
  IdNameCount,
  Gene
} from '../domain/deepblue';

import {
  DeepBlueIntersection,
  DeepBlueMiddlewareOverlapResult,
  DeepBlueOperation,
  DeepBlueRequest,
  DeepBlueResult,
  DeepBlueSelectData,
  DeepBlueParameters,
  DeepBlueFilter,
  FilterParameter
} from '../domain/operations';

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
          xmlrpc_request_parameters.push(raw_value);
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

  IdObjectCache = new DataCache<IdName, FullMetadata>();

  idNamesQueryCache = new DataCache<Name, DeepBlueOperation>();


  intersectsQueryCache = new MultiKeyDataCache<DeepBlueOperation, DeepBlueIntersection>();

  requestCache = new DataCache<DeepBlueOperation, DeepBlueRequest>();
  resultCache = new DataCache<DeepBlueRequest, DeepBlueResult>()


  constructor(private initalized = false) { }

  public init(): Observable<boolean> {

    console.log("deepblue 1", this.isInitialized());

    if (this.isInitialized()) {
      console.log("deepblue 2", this.isInitialized());
      return Observable.of(true);
    }

    let client = xmlrpc.createClient(xmlrpc_host);
    let subject: Subject<boolean> = new Subject<boolean>();

    client.methodCall("commands", [], (error: Object, value: any) => {
      console.log("deepblue 3", this.isInitialized());
      let commands = value[1];
      for (let command_name in commands) {
        let command = new Command(command_name, commands[command_name]["parameters"]);
        commands[command_name] = command;
      }
      this._commands = commands;

      console.log("deepblue 4", this.isInitialized());
      subject.next(true);
      subject.complete();
      this.initalized = true;
    });


    console.log("deepblue 5", this.isInitialized());
    return subject.asObservable();
  }

  public isInitialized() : boolean {
    return this.initalized;
  }

  execute(command_name: string, parameters: Object, status: RequestStatus): Observable<[string, any]> {

    let command: Command = this._commands[command_name];
    return command.makeRequest(parameters).map((body: string[]) => {
      let command_status: string = body[0];
      let response: any = body[1] || "";
      if (command_status === "error") {
        console.error(command_name, parameters, response);
      }
      status.increment();
      return <[string, any]>[command_status, response];
    });
  }

  selectExperiment(experiment: Name, status: RequestStatus): Observable<DeepBlueOperation> {
    if (!experiment) {
      return Observable.empty<DeepBlueOperation>();
    }

    let cached_operation = this.idNamesQueryCache.get(experiment);
    if (cached_operation) {
      status.increment();
      return Observable.of(cached_operation);
    }

    let params: Object = new Object();
    params["experiment_name"] = experiment.name;

    return this.execute("select_experiments", params, status).map((response: [string, any]) => {
      status.increment();
      return new DeepBlueSelectData(experiment, response[1], "select_experiment");
    }).do((operation) => {
      this.idNamesQueryCache.put(experiment, operation);
    }).catch(this.handleError);
  }

  select_regions_from_metadata(genome: string, type: string, epigenetic_mark: string,
    biosource: string, sample: string, technique: string, project: string,
    status: RequestStatus): Observable<DeepBlueOperation> {

    const params = new DeepBlueParameters(genome, type, epigenetic_mark, biosource, sample, technique, project);

    return this.execute("select_regions", params, status).map((response: [string, any]) => {
      status.increment();
      return new DeepBlueSelectData(params, response[1], "select_regions_from_metadata");
    }).catch(this.handleError);
  }

  filter_regions(query_data_id: DeepBlueOperation, filter: FilterParameter, status: RequestStatus): Observable<DeepBlueOperation> {
    let params = filter.asKeyValue();
    params["query_id"] = query_data_id.queryId();

    return this.execute("filter_regions", params, status).map((response: [string, any]) => {
      status.increment();
      return new DeepBlueFilter(query_data_id, filter, response[1]);
    }).catch(this.handleError);
  }

  selectGenes(gene_model_name: Name, status: RequestStatus): Observable<DeepBlueOperation> {
    let cached_operation = this.idNamesQueryCache.get(gene_model_name);
    if (cached_operation) {
      status.increment();
      return Observable.of(cached_operation);
    }

    const params: Object = new Object();
    params['gene_model'] = gene_model_name.name;

    return this.execute("select_genes", params, status).map((response: [string, any]) => {
      status.increment();
      return new DeepBlueSelectData(gene_model_name, response[1], 'select_genes');
    }).do((operation) => {
      this.idNamesQueryCache.put(gene_model_name, operation);
    }).catch(this.handleError);
  }


  intersection(query_data_id: DeepBlueOperation, query_filter_id: DeepBlueOperation, status: RequestStatus): Observable<DeepBlueIntersection> {

    let cache_key = [query_data_id, query_filter_id];

    let cached_intersection = this.intersectsQueryCache.get(cache_key);
    if (cached_intersection) {
      status.increment();
      return Observable.of(cached_intersection);
    }

    let params = {};
    params["query_data_id"] = query_data_id.queryId();
    params["query_filter_id"] = query_filter_id.queryId();
    return this.execute("intersection", params, status)
      .map((response: [string, any]) => {
        return new DeepBlueIntersection(query_data_id, query_filter_id, response[1])
      })

      .do((operation: DeepBlueIntersection) => this.intersectsQueryCache.put(cache_key, operation))

      .catch(this.handleError);
  }

  count_regions(op_exp: DeepBlueOperation, status: RequestStatus): Observable<DeepBlueResult> {

    if (this.requestCache.get(op_exp)) {
      status.increment();
      let cached_result = this.requestCache.get(op_exp);
      return this.getResult(cached_result, status);

    } else {
      let params = new Object();
      params["query_id"] = op_exp.queryId();

      return this.execute("count_regions", params, status).map((data: [string, any]) => {
        let request = new DeepBlueRequest(op_exp, data[1], "count_regions");
        this.requestCache.put(op_exp, request);
        return request;
      }).flatMap((request_id) => {
        return this.getResult(request_id, status);
      })
    }
  }

  distinct_column_values(data: DeepBlueOperation, field: string, status: RequestStatus): Observable<string[]> {
    const params: Object = new Object();
    params['query_id'] = data.queryId();
    params['field'] = field;

    return this.execute("distinct_column_values", params, status).map((response: [string, any]) => {
      status.increment();
      return new DeepBlueRequest(data, response[1], 'distinct_column_values');
    }).flatMap((request_id) => {
      return this.getResult(request_id, status);
    }).catch(this.handleError);
  }

  enrich_regions_go_terms(data: DeepBlueOperation, gene_model_name: Name, status: RequestStatus): Observable<DeepBlueResult> {
    const params: Object = new Object();
    params['query_id'] = data.queryId();
    params['gene_model'] = gene_model_name.name;

    return this.execute("enrich_regions_go_terms", params, status).map((response: [string, any]) => {
      status.increment();
      return new DeepBlueRequest(data, response[1], 'enrich_regions_go_terms');
    }).flatMap((request_id) => {
      return this.getResult(request_id, status);
    }).catch(this.handleError);
  }

  list_epigenetic_marks(status: RequestStatus, type?: string): Observable<IdName[]> {
    const params: Object = new Object();
    if (type) {
      params["extra_metadata"] = { "type": type };
    }

    return this.execute("list_epigenetic_marks", params, status).map((response: [string, any]) => {
      const data = response[1] || [];
      return data.map((value) => {
        return new GeneModel(value);
      }).sort((a: IdName, b: IdName) => a.name.localeCompare(b.name));
    });
  }

  collection_experiments_count(status: RequestStatus, controlled_vocabulary: string, type?: string, genome?: string): Observable<IdNameCount[]> {
    const params: Object = new Object();

    params["controlled_vocabulary"] = controlled_vocabulary;
    if (type) {
      params["type"] = type;
    }
    if (genome) {
      params["genome"] = genome;
    }

    return this.execute("collection_experiments_count", params, status).map((response: [string, any]) => {
      const data = response[1] || [];
      return data.map((value) => {
        return new IdNameCount(value[0], value[1], value[2]);
      }).sort((a: IdName, b: IdName) => a.name.localeCompare(b.name));
    });
  }

  list_experiments(status: RequestStatus, type?: string, epigenetic_mark?: string): Observable<IdName[]> {
    const params: Object = new Object();
    if (type) {
      params["type"] = type;
    }
    if (epigenetic_mark) {
      params["epigenetic_mark"] = epigenetic_mark;
    }

    return this.execute("list_experiments", params, status).map((response: [string, any]) => {
      const data = response[1] || [];
      return data.map((value) => {
        return new GeneModel(value);
      }).sort((a: IdName, b: IdName) => a.name.localeCompare(b.name));
    });
  }

  list_gene_models(status: RequestStatus): Observable<IdName[]> {
    const params: Object = new Object();

    return this.execute("list_gene_models", params, status).map((response: [string, any]) => {
      const data = response[1] || [];
      return data.map((value) => {
        return new GeneModel(value);
      }).sort((a: IdName, b: IdName) => a.name.localeCompare(b.name));
    });
  }

  list_genes(gene_model: GeneModel | string, status: RequestStatus): Observable<Gene[]> {
    let gene_model_name = "";
    if (gene_model instanceof GeneModel) {
      gene_model_name = gene_model.name;
    } else {
      gene_model_name = gene_model;
    }

    const params: Object = new Object();

    params["gene_model"] = gene_model_name;

    return this.execute("list_genes", params, status).map((response: [string, any]) => {
      const data = response[1] || [];
      return data.map((value) => {
        return new Gene(value);
      }).sort((a: IdName, b: IdName) => a.name.localeCompare(b.name));
    });
  }

  info(id_name: IdName, status: RequestStatus): Observable<FullMetadata> {

    let object = this.IdObjectCache.get(id_name);
    if (object) {
      status.increment();
      return Observable.of(object);
    }

    return this.execute("info", id_name, status).map((response: [string, any]) => {
      return new FullMetadata(response[1][0]);
    })
      .do((info_object: FullMetadata) => {
        this.IdObjectCache.put(id_name, info_object)
      });
  }

  infos(id_names: IdName[], status: RequestStatus): Observable<FullMetadata[]> {
    let total = 0;
    let observableBatch: Observable<FullMetadata>[] = [];

    id_names.forEach((id_name: IdName) => {
      observableBatch.push(this.info(id_name, status));
    });

    return Observable.forkJoin(observableBatch);
  }


  getResult(op_request: DeepBlueRequest, status: RequestStatus): Observable<DeepBlueResult> {

    let result = this.resultCache.get(op_request);
    if (result) {
      status.increment();
      return Observable.of(result);
    }

    let params = new Object();
    params["request_id"] = op_request.request_id;

    let pollSubject = new Subject<DeepBlueResult>();
    let client = xmlrpc.createClient(xmlrpc_host);

    let isProcessing = false;

    let timer = Observable.timer(0, Utils.rnd(500, 1000)).do(() => {
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
          status.increment();
          let op_result = new DeepBlueResult(op_request, value[1]);
          this.resultCache.put(op_request, op_result);
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
