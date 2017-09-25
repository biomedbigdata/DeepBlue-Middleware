import { RequestStatus } from '../domain/status';
import { DeepBlueResult, DeepBlueOperation } from '../domain/operations';
import { DeepBlueService } from "../service/deepblue";
import { IdName, IdNameCount } from "../domain/deepblue";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs";

export class RegionsEnrichment {
  constructor(private deepBlueService: DeepBlueService) { }

  private listExperiments(request_status: RequestStatus, epigenetic_mark: string): Observable<[string, string[]]> {
    return this.deepBlueService.list_experiments(request_status, "peaks", epigenetic_mark).map(((experiments: IdName[]) =>
      <[string, string[]]>[epigenetic_mark, experiments.map((experiment: IdName) => experiment.name)]
    ));
  }

  private listExperimentsMany(request_status: RequestStatus, epigenetic_marks: string[]): Observable<Array<[string, string[]]>> {
    let observableBatch: Observable<[string, string[]]>[] = [];
    epigenetic_marks.forEach((epigenetic_mark: string) => {
      observableBatch.push(this.listExperiments(request_status, epigenetic_mark));
    });
    return Observable.forkJoin(observableBatch);
  }

  buildFullDatabases(request_status: RequestStatus, genome: string): Observable<[string, string[]][]> {
    let pollSubject = new Subject<[string, string[]][]>();

    this.deepBlueService.collection_experiments_count(request_status, "epigenetic_marks", "peaks", genome).subscribe((ems: IdNameCount[]) => {
      let histone_marks_names = ems.map((id_name: IdNameCount) => id_name.name);
      this.listExperimentsMany(request_status, histone_marks_names).subscribe((dbs: [string, string[]][]) => {
        pollSubject.next(dbs.filter((em) => {
          return em[1].length > 0
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
      console.log(current_op);
      let o = this.deepBlueService.enrich_regions_overlap(current_op.getDataQuery(), universe_id, datasets, status);
      observableBatch.push(o);
    });

    return Observable.forkJoin(observableBatch);
  }

}