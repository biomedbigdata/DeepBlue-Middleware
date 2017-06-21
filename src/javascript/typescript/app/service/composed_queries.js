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
                    const filteredGeneModels = fullMetadata.filter((geneModel) => {
                        return geneModel.genome().toLocaleLowerCase() === genome.name.toLocaleLowerCase();
                    });
                    response.next(filteredGeneModels);
                    response.complete();
                });
            });
        });
        return response.asObservable();
    }
    chromatinStatesByGenome(genome, status) {
        let response = new rxjs_1.Subject();
        this.deepBlueService.select_regions_from_metadata(genome.name, null, "Chromatin State Segmentation", null, null, null, null, status).subscribe((experiments_query) => {
            this.deepBlueService.distinct_column_values(experiments_query, "NAME", status).subscribe((csss) => {
                setTimeout(() => {
                    response.next(csss);
                    response.complete();
                });
            });
        });
        return response.asObservable();
    }
}
exports.ComposedQueries = ComposedQueries;
