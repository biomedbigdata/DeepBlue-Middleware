import { RequestStatus } from '../domain/status';
import { Observable } from 'rxjs/Observable'
import { Subject } from "rxjs";

import { DeepBlueService } from '../service/deepblue';

import { IdName, Name, Id, FullMetadata } from '../domain/deepblue';

import {
  DeepBlueIntersection,
  DeepBlueFilter,
  DeepBlueOperation,
  DeepBlueResult,
  FilterParameter,
  DeepBlueSelectData,
  DeepBlueTilingRegions,
  DeepBlueArgs,
  DeepBlueMiddlewareOverlapResult
} from '../domain/operations';

export class ComposedData {
  constructor(private deepBlueService: DeepBlueService) { }

  /*

loadData() {
    this.deepBlueService.list_epigenetic_marks
  }

  getHistones(): Observable<EpigeneticMark[]> {
    if (!this.getGenome()) {
    return Observable.empty<EpigeneticMark[]>();
  }
const params: URLSearchParams = new URLSearchParams();
params.set('genome', this.getGenome().name);
params.set('controlled_vocabulary', 'epigenetic_marks');
params.set('type', 'peaks');
return this.http.get(this.deepBlueUrl + '/collection_experiments_count', { 'search': params })
    .map(this.extractHistone)
    .catch(this.handleError);


    list_epigenetic_marks

    infos

    make groups
*/

  get_epigenomic_marks_categories(status: RequestStatus): Observable<FullMetadata[]> {
    return this.deepBlueService.list_epigenetic_marks(status).flatMap((ems: IdName[]) =>
      this.deepBlueService.infos(ems, status)
    );
  }

}

