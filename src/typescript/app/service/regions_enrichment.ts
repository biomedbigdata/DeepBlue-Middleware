import { RequestStatus } from '../domain/status';
import { DeepBlueResult } from '../domain/operations';
import { DeepBlueService } from "app/service/deepblue";
import { IdName } from "app/domain/deepblue";
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

  private getHistoneModificationDatabases(request_status: RequestStatus, genome: string): Observable<Map<string, string[]>> {

    let pollSubject = new Subject<Map<string, string[]>>();

    this.deepBlueService.list_epigenetic_marks(request_status, "Histone Modification").subscribe((histone_marks: IdName[]) => {
      let histone_marks_names = histone_marks.map((id_name: IdName) => id_name.name);
      console.log(histone_marks_names);
      //this.listExperimentsMany(request_status, histone_marks_names).subscribe((dbs: [string, string[]][]) => {
      //  console.log(dbs);
      //})
    });

    return Observable.of(null);
  }

  buildDatabases(request_status: RequestStatus, genome: string): Observable<string[]> {

    "Histone Modification"
    "Transcription Factor Binding Sites"
    "Gene Expression"

    this.getHistoneModificationDatabases(request_status, genome).subscribe((value) => {
      console.log(value);
    });

    return Observable.of(null);
  }
}