import { RequestStatus } from '../domain/status';
import { DeepBlueResult } from '../domain/operations';
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

  enrichRegionsOverlap(request_status: RequestStatus, query_id: string, universe_id: string, datasets: Object): Observable<Object> {
    return this.deepBlueService.enrich_regions_overlap(query_id, universe_id, datasets, request_status);

  }

}