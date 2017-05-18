import { RequestStatus } from '../domain/status';
import { Observable } from 'rxjs/Observable'
import { Subject } from "rxjs";

import { DeepBlueService } from '../service/deepblue';

import { FullGeneModel, FullMetadata, IdName, Name } from '../domain/deepblue';
import { DeepBlueIntersection, DeepBlueOperation, DeepBlueResult } from '../domain/operations';

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
}