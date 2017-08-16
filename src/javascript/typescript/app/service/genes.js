"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deepblue_1 = require("../domain/deepblue");
const Observable_1 = require("rxjs/Observable");
class Genes {
    constructor(deepBlueService) {
        this.deepBlueService = deepBlueService;
        this.genes_models = new Map();
    }
    getGenes(status, gene_model) {
        let gene_model_name = "";
        if (gene_model instanceof deepblue_1.GeneModel) {
            gene_model_name = gene_model.name;
        }
        else {
            gene_model_name = gene_model;
        }
        if (this.genes_models[gene_model_name]) {
            return Observable_1.Observable.of(this.genes_models[gene_model_name]);
        }
        return this.deepBlueService.list_genes(gene_model_name, status)
            .do((gene_names) => this.genes_models[gene_model_name] = gene_names);
    }
    listGeneName(name_id, status, gene_model) {
        return this.getGenes(status, gene_model)
            .map((genes) => genes.filter((gene) => name_id.length == 0 || gene.gene_id().includes(name_id) || gene.gene_name().includes(name_id)));
    }
}
exports.Genes = Genes;
