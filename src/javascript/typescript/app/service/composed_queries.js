"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
class ComposedQueries {
    constructor(deepBlueService) {
        this.deepBlueService = deepBlueService;
    }
    geneModelsByGenome(genome, status) {
        let response = new rxjs_1.Subject();
        this.deepBlueService.list_gene_models(status).subscribe((id_names) => {
            this.deepBlueService.infos(id_names, status).subscribe((fullMetadata) => {
                setTimeout(() => {
                    console.log(fullMetadata);
                    const filteredGeneModels = fullMetadata.filter((geneModel) => {
                        console.log("genemodel genome", geneModel.genome());
                        console.log("genome.name", genome.name);
                        return geneModel.genome().toLocaleLowerCase() === genome.name.toLocaleLowerCase();
                    });
                    response.next(filteredGeneModels);
                    response.complete();
                });
            });
        });
        return response.asObservable();
    }
}
exports.ComposedQueries = ComposedQueries;
