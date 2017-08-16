import { RequestStatus } from '../domain/status';
import { DeepBlueResult } from '../domain/operations';
import { DeepBlueService } from "../service/deepblue";
import { IdName, IdNameCount, GeneModel, Gene } from "../domain/deepblue";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs";

export class Genes {
  constructor(private deepBlueService: DeepBlueService) { }

  genes_models = new Map<string, string[]>();

  getGenes(status: RequestStatus, gene_model: GeneModel | string): Observable<Gene[]> {

    let gene_model_name = "";
    if (gene_model instanceof GeneModel) {
      gene_model_name = gene_model.name;
    } else {
      gene_model_name = gene_model;
    }

    if (this.genes_models[gene_model_name]) {
      return Observable.of(this.genes_models[gene_model_name]);
    }

    return this.deepBlueService.list_genes(gene_model_name, status)
      .do((gene_names) => this.genes_models[gene_model_name] = gene_names);

  }

  listGeneName(name_id: string, status: RequestStatus, gene_model: GeneModel | string): Observable<Gene[]> {
    return this.getGenes(status, gene_model)
      .map((genes: Gene[]) =>
        genes.filter((gene: Gene) => name_id.length == 0 || gene.gene_id().includes(name_id) || gene.gene_name().includes(name_id))
      );
  }
}