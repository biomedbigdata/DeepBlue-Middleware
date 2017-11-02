import { RequestStatus } from '../domain/status';
import { DeepBlueResult, DeepBlueOperation, FilterParameter, DeepBlueFilter } from '../domain/operations';
import { DeepBlueService } from "../service/deepblue";
import { IdName, IdNameCount } from "../domain/deepblue";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs";

export class RegionsEnrichment {
  chromatinCache = null;

  constructor(private deepBlueService: DeepBlueService) { }

  private getChromatinStates(request_status: RequestStatus, genome: string): Observable<DeepBlueResult> {
    return this.deepBlueService.select_regions_from_metadata(genome, "peaks", "Chromatin State Segmentation",
      null, null, null, null, request_status).flatMap((op: DeepBlueOperation) => {
        return this.deepBlueService.distinct_column_values(op, "NAME", request_status)
      })
  }

  private buildChromatinStatesQueries(request_status: RequestStatus, genome: string): Observable<[string, any[]]> {
    let response = new Subject<[string, [string, [string, string, string][]][]]>();

    if (this.chromatinCache) {
      return Observable.of(this.chromatinCache);
    }

    Observable.forkJoin([
      this.getChromatinStates(request_status, genome),
      this.deepBlueService.list_experiments(request_status, "peaks", "Chromatin State Segmentation", genome)
    ]).subscribe((subs: any[]) => {

      let states: { [key: string]: number } = (<DeepBlueResult>subs[0]).resultAsDistinct()
      let state_names = Object.keys(states);
      let experiments: IdName[] = subs[1];

      let total_processed = 0;

      let exp_states_obs = experiments.map((experiment) => {
        return this.deepBlueService.selectExperiment(experiment, request_status)
          .flatMap((exp_op: DeepBlueOperation) => {
            return this.deepBlueService.query_cache(exp_op, request_status)
          })
          .flatMap((exp_cached: DeepBlueOperation) => {
            let filter_queries = new Array<Observable<DeepBlueFilter>>();
            for (let state of state_names) {
              let filter = new FilterParameter("NAME", "==", state, "string");
              let filter_op = this.deepBlueService.filter_regions(exp_cached, filter, request_status);
              filter_queries.push(filter_op);
            }

            return Observable.forkJoin(filter_queries).map((filters) => {
              let exp_filter_id = new Array<string[]>();

              for (let filter of filters) {
                let filter_data = <IdName>filter.data();
                //console.log(JSON.stringify(filter_data));
                let exp_name = filter.getDataName();
                let exp_id = filter.getDataId().id;
                let filter_name = filter._params.value;
                let q_id = filter.queryId().id;
                exp_filter_id.push([exp_id, exp_name, filter_name, q_id]);
              }

              return exp_filter_id;
            })
          })
      })

      Observable.forkJoin(exp_states_obs).subscribe((filters) => {
        let states: { [key: string]: [string, string][] } = {};


        for (let exp_filters of filters) {
          for (let filter of exp_filters) {
            if (!(filter[2] in states)) {
              states[filter[2]] = new Array<[string, string]>();
            }
            states[filter[2]].push([filter[0], filter[1], filter[3]]);
          }
        }

        let arr_filter: [string, [string, string][]][] = Object.keys(states).map((state) => {
          return <[string, [string, string, string][]]>[state, states[state]]
        });

        //console.log(JSON.stringify(arr_filter));

        this.chromatinCache = ["Chomatin States Segmentation", arr_filter]
        response.next(this.chromatinCache);
        response.complete();
      });
    });

    return response.asObservable();
  };

  private listExperiments(request_status: RequestStatus, epigenetic_mark: string): Observable<[string, any[]]> {
    return this.deepBlueService.list_experiments(request_status, "peaks", epigenetic_mark).map(((experiments: IdName[]) =>
      <[string, [string, string][]]>[epigenetic_mark, experiments.map((experiment: IdName) => [experiment.id, experiment.name])]
    ));
  }



  //  {[key: string]: [string, string][]};

  private listExperimentsMany(request_status: RequestStatus, epigenetic_marks: string[], genome: string): Observable<Array<[string, any[]]>> {
    let observableBatch: Observable<[string, any[]]>[] = [];
    epigenetic_marks.forEach((epigenetic_mark: string) => {
      let o;
      if (epigenetic_mark == "Chromatin State Segmentation") {
        o = this.buildChromatinStatesQueries(request_status, genome);
      } else {
        o = this.listExperiments(request_status, epigenetic_mark);
      }
      observableBatch.push(o);
    });
    return Observable.forkJoin(observableBatch);

  }

  buildFullDatabases(request_status: RequestStatus, genome: string): Observable<[string, string[]][]> {
    let pollSubject = new Subject<[string, string[]][]>();

    this.deepBlueService.collection_experiments_count(request_status, "epigenetic_marks", "peaks", genome).subscribe((ems: IdNameCount[]) => {
      let histone_marks_names = ems.map((id_name: IdNameCount) => id_name.name);
      this.listExperimentsMany(request_status, histone_marks_names, genome).subscribe((dbs: [string, string[]][]) => {
        pollSubject.next(dbs.filter((em) => {
          return em && em[1].length > 0
        }));
        pollSubject.complete();
      })
    });

    return pollSubject.asObservable();
  }

  enrichRegionsOverlap(data_query_id: DeepBlueOperation[], universe_id: string, datasets: Object, status: RequestStatus): Observable<DeepBlueResult[]> {
    var start = new Date().getTime();

    let total = data_query_id.length * data_query_id.length * 3;
    status.reset(total);

    let response: Subject<DeepBlueResult[]> = new Subject<DeepBlueResult[]>();

    let observableBatch: Observable<DeepBlueResult>[] = [];

    data_query_id.forEach((current_op) => {
      let o = this.deepBlueService.enrich_regions_overlap(current_op, universe_id, datasets, status);
      observableBatch.push(o);
    });

    return Observable.forkJoin(observableBatch);
  }

}