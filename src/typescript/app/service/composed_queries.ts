import { Observable } from 'rxjs/Observable'
import { Subject } from "rxjs";

import {
  Experiment,
  FullGeneModel,
  FullMetadata,
  IdName,
  Name
} from '../domain/deepblue';

import { RequestStatus } from '../domain/status';
import { DeepBlueService } from '../service/deepblue';
import { Experiments } from './experiments';
import {
  DeepBlueIntersection,
  DeepBlueOperation,
  DeepBlueResult,
  DeepBlueSelectData
} from '../domain/operations';

export class ComposedQueries {

  constructor(private deepBlueService: DeepBlueService) { }

  geneModelsByGenome(genome: Name, status: RequestStatus): Observable<FullGeneModel[]> {

    let response = new Subject<FullGeneModel[]>();

    this.deepBlueService.list_gene_models(status).subscribe((id_names: IdName[]) => {
      this.deepBlueService.infos(id_names, status).subscribe((fullMetadata: FullGeneModel[]) => {
        setTimeout(() => {

          console.log(fullMetadata);

          const filteredGeneModels = fullMetadata.filter((geneModel) => {
            console.log("genemodel genome", geneModel.genome());
            console.log("genome.name", genome.name);
            return geneModel.genome().toLocaleLowerCase() === genome.name.toLocaleLowerCase()
          });

          response.next(filteredGeneModels);
          response.complete();
        });
      });
    });

    return response.asObservable();
  }

  chromatinStatesByGenome(genome: Name, status: RequestStatus): Observable<string[]> {

    let response = new Subject<string[]>();

    this.deepBlueService.select_regions_from_metadata(genome.name, null, "Chromatin State Segmentation", null, null, null, null, status).subscribe((experiments_query: DeepBlueSelectData) => {
      this.deepBlueService.distinct_column_values(experiments_query, "NAME", status).subscribe((csss: string[]) => {
        setTimeout(() => {
          console.log(csss);
          response.next(csss);
          response.complete();
        });
      });
    });

    return response.asObservable();
  }
}
