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
  Gene,
  Id
} from '../domain/deepblue';

import {
  DeepBlueIntersection,
  DeepBlueMiddlewareOverlapResult,
  DeepBlueOperation,
  DeepBlueRequest,
  DeepBlueResult,
  DeepBlueFilter,
  FilterParameter,
  DeepBlueResultStatus,
  DeepBlueError,
  DeepBlueCommandExecutionResult,
  DeepBlueDataParameter,
  DeepBlueMetadataParameters
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

  IdObjectCache = new DataCache<Id, FullMetadata>();

  idNamesQueryCache = new DataCache<Name, DeepBlueOperation>();


  intersectsQueryCache = new MultiKeyDataCache<DeepBlueOperation, DeepBlueIntersection>();

  requestCache = new DataCache<DeepBlueOperation, DeepBlueRequest>();
  resultCache = new DataCache<DeepBlueRequest, DeepBlueResult>()


  constructor(private initalized = false) { }

  public init(): Observable<boolean> {

    if (this.isInitialized()) {
      return Observable.of(true);
    }

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
      this.initalized = true;
    });

    return subject.asObservable();
  }

  public isInitialized(): boolean {
    return this.initalized;
  }

  execute(command_name: string, parameters: Object, status: RequestStatus): Observable<[DeepBlueResultStatus, any]> {

    let command: Command = this._commands[command_name];
    return command.makeRequest(parameters).map((body: string[]) => {
      let command_status: string = body[0];

      let status_result: DeepBlueResultStatus;
      if (command_status == "error") {
        status_result = DeepBlueResultStatus.Error;
      } else {
        status_result = DeepBlueResultStatus.Okay;
      }

      let response: any = body[1] || "";
      if (command_status === "error") {
        console.error(command_name, parameters, response);
      }
      status.increment();
      return <[DeepBlueResultStatus, any]>[status_result, response];
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

    return this.execute("select_experiments", params, status).map((response: [string, string]) => {
      status.increment();
      return new DeepBlueOperation(new DeepBlueDataParameter(experiment), new Id(response[1]), "select_experiment");
    }).do((operation) => {
      this.idNamesQueryCache.put(experiment, operation);
    }).catch(this.handleError);
  }

  select_regions_from_metadata(genome: string, type: string, epigenetic_mark: string,
    biosource: string, sample: string, technique: string, project: string,
    status: RequestStatus): Observable<DeepBlueOperation> {

    const params = new DeepBlueMetadataParameters(genome, type, epigenetic_mark, biosource, sample, technique, project);

    return this.execute("select_regions", params, status).map((response: [string, string]) => {
      status.increment();
      return new DeepBlueOperation(params, new Id(response[1]), "select_regions_from_metadata");
    }).catch(this.handleError);
  }

  filter_regions(query_data_id: DeepBlueOperation, filter: FilterParameter, status: RequestStatus): Observable<DeepBlueFilter> {
    let params = filter.asKeyValue();
    params["query_id"] = query_data_id.queryId().id;

    return this.execute("filter_regions", params, status).map((response: [string, string]) => {
      status.increment();
      return new DeepBlueFilter(query_data_id, filter, new Id(response[1]));
    }).catch(this.handleError);
  }

  query_cache(query_data: DeepBlueOperation, status: RequestStatus): Observable<DeepBlueOperation> {
    let params = new Object();
    params["query_id"] = query_data.queryId().id;
    params["cache"] = "true";

    return this.execute("query_cache", params, status).map((response: [string, string]) => {
      status.increment();
      return query_data.cacheIt(new Id(response[1]));
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

    return this.execute("select_genes", params, status).map((response: [string, string]) => {
      status.increment();
      return new DeepBlueOperation(new DeepBlueDataParameter(gene_model_name), new Id(response[1]), 'select_genes');
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
    params["query_data_id"] = query_data_id.queryId().id;
    params["query_filter_id"] = query_filter_id.queryId().id;
    return this.execute("intersection", params, status)
      .map((response: [string, string]) => {
        return new DeepBlueIntersection(query_data_id, query_filter_id, new Id(response[1]))
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
      params["query_id"] = op_exp.queryId().id;

      return this.execute("count_regions", params, status).map((data: [string, string]) => {
        let request = new DeepBlueRequest(op_exp, data[1], "count_regions");
        this.requestCache.put(op_exp, request);
        return request;
      }).flatMap((request) => {
        return this.getResult(request, status);
      })
    }
  }

  distinct_column_values(data: DeepBlueOperation, field: string, status: RequestStatus): Observable<DeepBlueResult> {
    const params: Object = new Object();
    params['query_id'] = data.queryId().id;
    params['field'] = field;

    return this.execute("distinct_column_values", params, status).map((response: [string, string]) => {
      status.increment();
      return new DeepBlueRequest(data, response[1], 'distinct_column_values');
    }).flatMap((request_id) => {
      return this.getResult(request_id, status);
    }).catch(this.handleError);
  }

  enrich_regions_go_terms(data: DeepBlueOperation, gene_model_name: Name, status: RequestStatus): Observable<DeepBlueResult> {
    const params: Object = new Object();
    params['query_id'] = data.queryId().id;
    params['gene_model'] = gene_model_name.name;

    return this.execute("enrich_regions_go_terms", params, status).map((response: [string, string]) => {
      status.increment();
      return new DeepBlueRequest(data, response[1], 'enrich_regions_go_terms');
    }).flatMap((request_id) => {
      return this.getResult(request_id, status);
    }).catch(this.handleError);
  }

  enrich_regions_overlap(data: DeepBlueOperation, genome: string, universe_id: string, datasets: Object, status: RequestStatus): Observable<DeepBlueResult> {
    const params: Object = new Object();
    params['query_id'] = data.queryId().id;
    params['background_query_id'] = universe_id;
    params['datasets'] = datasets;
    params["genome"] = genome;

    return this.execute("enrich_regions_overlap", params, status).map((response: [string, string]) => {
      status.increment();
      return new DeepBlueRequest(data, response[1], 'enrich_regions_overlap');
    }).flatMap((request_id) => {
      return this.getResult(request_id, status);
    }).catch(this.handleError);
  }

  enrich_regions_fast(data: DeepBlueOperation, genome: string, filter: Object, status: RequestStatus): Observable<DeepBlueResult> {
    const params: Object = new Object();
    params['query_id'] = data.queryId().id;
    params['genome'] = genome;

    for (let o of Object.keys(filter)) {
      params[o] = filter[o];
    }

    return this.execute("enrich_regions_fast", params, status).map((response: [string, string]) => {
      status.increment();
      return new DeepBlueRequest(data, response[1], 'enrich_regions_fast');
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

  collection_experiments_count(status: RequestStatus, controlled_vocabulary: string, type?: string, genome?: string, technique?: string): Observable<IdNameCount[]> {
    const params: Object = new Object();

    params["controlled_vocabulary"] = controlled_vocabulary;
    if (type) {
      params["type"] = type;
    }

    if (genome) {
      params["genome"] = genome;
    }

    if (technique) {
      params["technique"] = technique
    }

    return this.execute("collection_experiments_count", params, status).map((response: [string, any]) => {
      const data = response[1] || [];
      return data.map((value) => {
        return new IdNameCount(value[0], value[1], value[2]);
      }).sort((a: IdName, b: IdName) => a.name.localeCompare(b.name));
    });
  }

  list_experiments(status: RequestStatus, type?: string, epigenetic_mark?: string, genome?: string): Observable<IdName[]> {
    const params: Object = new Object();
    if (type) {
      params["type"] = type;
    }
    if (epigenetic_mark) {
      params["epigenetic_mark"] = epigenetic_mark;
    }

    if (genome) {
      params["genome"] = genome;
    }

    return this.execute("list_experiments", params, status).map((response: [string, any]) => {
      const data = response[1] || [];
      return data.map((value) => {
        return new Experiment(value);
      }).sort((a: IdName, b: IdName) => a.name.localeCompare(b.name));
    });
  }

  list_experiments_full(status: RequestStatus, type?: string, epigenetic_mark?: string, genome?: string): Observable<FullMetadata[]> {

    return this.list_experiments(status, type, epigenetic_mark, genome).flatMap((ids: IdName[]) =>
      this.infos(ids, status)
    )
  }

  get_biosource_related(biosource: string, status: RequestStatus): Observable<DeepBlueCommandExecutionResult<string[]>> {
    const params: Object = new Object();
    params["biosource"] = biosource;

    return this.execute("get_biosource_related", params, status).map((response: [DeepBlueResultStatus, Array<string>]) =>
      new DeepBlueCommandExecutionResult(response[0], response[1])
    );
  }

  get_biosource_children(biosource: string, status: RequestStatus): Observable<DeepBlueCommandExecutionResult<string[]>> {
    const params: Object = new Object();
    params["biosource"] = biosource;

    return this.execute("get_biosource_children", params, status).map((response: [DeepBlueResultStatus, Array<string>]) =>
      new DeepBlueCommandExecutionResult(response[0], response[1])
    );
  }

  get_biosource_synonyms(biosource: string, status: RequestStatus): Observable<DeepBlueCommandExecutionResult<string[]>> {
    const params: Object = new Object();
    params["biosource"] = biosource;

    return this.execute("get_biosource_synonyms", params, status).map((response: [DeepBlueResultStatus, Array<string>]) =>
      new DeepBlueCommandExecutionResult(response[0], response[1])
    );
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

  info(id: Id, status: RequestStatus): Observable<FullMetadata> {

    let object = this.IdObjectCache.get(id);
    if (object) {
      status.increment();
      return Observable.of(object);
    }

    const params: Object = new Object();
    params["id"] = id.id;

    return this.execute("info", params, status).map((response: [string, any]) => {
      return new FullMetadata(response[1][0]);
    })
      .do((info_object: FullMetadata) => {
        this.IdObjectCache.put(id, info_object)
      });
  }

  infos(id_names: IdName[], status: RequestStatus): Observable<FullMetadata[]> {
    let total = 0;
    let observableBatch: Observable<FullMetadata>[] = [];

    id_names.forEach((id_name: IdName) => {
      observableBatch.push(this.info(id_name.id, status));
    });

    return Observable.forkJoin(observableBatch);
  }

  inputRegions(genome: Name, region_set: string, status: RequestStatus): Observable<DeepBlueOperation> {
    const params: Object = new Object();
    params['genome'] = genome.name;
    params['region_set'] = region_set;

    return this.execute("input_regions", params, status).map((response: [string, string]) => {
      status.increment();
      return new DeepBlueOperation(new DeepBlueDataParameter("User regions"), new Id(response[1]), 'input_regions');
    }).catch(this.handleError);
  }

  cancelRequest(id: string, status: RequestStatus): Observable<string> {
    const params: Object = new Object();
    params['id'] = id;

    return this.execute("cancel_request", params, status).map((response: [string, string]) => {
      status.increment();
      return response;
    }).catch(this.handleError);
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

    let isProcessing = false;

    let timer = Observable.timer(0, Utils.rnd(500, 1000)).do(() => {
      if (isProcessing) {
        return;
      }
      isProcessing = true;

      if (status.canceled) {
        this.cancelRequest(op_request.request_id, status).subscribe((id) => {
          isProcessing = false;
          let op_result = new DeepBlueError(op_request, "Canceled by user");
          timer.unsubscribe();
          pollSubject.next(op_result);
          pollSubject.complete();
        });
        return;
      }

      this.execute("info", { "id": op_request.request_id }, status).subscribe((info: [DeepBlueResultStatus, any]) => {

        let state = info[1][0]['state'];

        if (state == "done") {
          let client = xmlrpc.createClient(xmlrpc_host);
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

        } else if (state == "error") {
          status.increment();
          let message = info[1][0]['message'];
          let op_result = new DeepBlueError(op_request, message);
          this.resultCache.put(op_request, op_result);
          timer.unsubscribe();
          pollSubject.next(op_result);
          pollSubject.complete();

        } else { // 'new' or 'running'
          isProcessing = false;
        }
      })


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
