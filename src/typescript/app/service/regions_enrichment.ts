import { RequestStatus } from '../domain/status';
import { DeepBlueResult } from '../domain/operations';
import { DeepBlueService } from "app/service/deepblue";
import { IdName, IdNameCount } from "app/domain/deepblue";
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

  private getHistoneModificationDatabases(request_status: RequestStatus, genome: string): Observable<[string, string[]][]> {
    let pollSubject = new Subject<[string, string[]][]>();

    this.deepBlueService.collection_experiments_count(request_status, "epigenetic_marks", "peaks", genome).subscribe((ems: IdNameCount[]) => {
      console.log(ems);
      let histone_marks_names = ems.map((id_name: IdNameCount) => id_name.name);
      console.log(histone_marks_names);
      this.listExperimentsMany(request_status, histone_marks_names).subscribe((dbs: [string, string[]][]) => {
        pollSubject.next(dbs.filter((em) => {
          console.log(em[0], em[1].length);
          return em[1].length > 0
        }));
        pollSubject.complete();
      })
    });

    return pollSubject.asObservable();
  }

  buildDatabases(request_status: RequestStatus, genome: string): Observable<[string, string[]][]> {

    "Histone Modification"
    "Transcription Factor Binding Sites"
    "Gene Expression"

    console.log("aaaa");
    return this.getHistoneModificationDatabases(request_status, genome);
  }
}