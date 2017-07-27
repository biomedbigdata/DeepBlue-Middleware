"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const requests_manager_1 = require("./service/requests_manager");
const deepblue_1 = require("./domain/deepblue");
const operations_1 = require("./domain/operations");
const express_1 = require("express");
const manager_1 = require("./service/manager");
const experiments_1 = require("./service/experiments");
const composed_commands = express_1.Router();
const express = require("express");
class ComposedCommandsRoutes {
    static getRequest(req, res, next) {
        let request_id = req.query["request_id"];
        let request_data = ComposedCommandsRoutes.requestManager.getRequest(request_id);
        if (request_data.finished) {
            res.send(["okay", request_data.getData()]);
        }
        else {
            res.send(["error",
                {
                    step: request_data.getStep(),
                    total: request_data.getTotal(),
                    processed: request_data.getProcessed()
                }
            ]);
        }
    }
    static countOverlaps(req, res, next) {
        manager_1.Manager.getComposedCommands().subscribe((cc) => {
            let queries_id = req.query["queries_id"];
            let experiments_id = req.query["experiments_id"];
            let filters = req.query["filters"];
            if (filters) {
                filters = JSON.parse(filters).map((f) => operations_1.FilterParameter.fromObject(f));
            }
            else {
                filters = [];
            }
            if (!(queries_id)) {
                res.send(['error', '"queried_id" not informed']);
                return;
            }
            if (!(experiments_id)) {
                res.send(['error', '"experiments_id" not informed']);
                return;
            }
            let status = ComposedCommandsRoutes.requestManager.startRequest();
            res.send(["okay", status.request_id.toLocaleString()]);
            if (!(Array.isArray(queries_id))) {
                queries_id = [queries_id];
            }
            if (!(Array.isArray(experiments_id))) {
                experiments_id = [experiments_id];
            }
            experiments_1.Experiments.info(experiments_id).subscribe((experiments) => {
                let deepblue_query_ops = queries_id.map((query_id, i) => new operations_1.DeepBlueSelectData(new deepblue_1.Name(query_id), query_id, "DIVE data"));
                let experiments_name = experiments.map((v) => new deepblue_1.Name(v["name"]));
                var ccos = cc.countOverlaps(deepblue_query_ops, experiments_name, filters, status).subscribe((results) => {
                    let rr = [];
                    for (let i = 0; i < results.length; i++) {
                        let result = results[i];
                        let resultObj = new operations_1.DeepBlueMiddlewareOverlapResult(result.getDataName(), result.getDataQuery(), result.getFilterName(), result.getFilterQuery(), result.resultAsCount());
                        rr.push(resultObj);
                    }
                    status.finish(rr);
                });
            });
        });
    }
    static countGenesOverlaps(req, res, next) {
        manager_1.Manager.getComposedCommands().subscribe((cc) => {
            let queries_id = req.query["queries_id"];
            let gene_model_name = req.query["gene_model_name"];
            let status = ComposedCommandsRoutes.requestManager.startRequest();
            res.send(["okay", status.request_id.toLocaleString()]);
            if (!(Array.isArray(queries_id))) {
                queries_id = [queries_id];
            }
            let deepblue_query_ops = queries_id.map((query_id, i) => new operations_1.DeepBlueSelectData(new deepblue_1.Name(query_id), query_id, "DIVE data"));
            var ccos = cc.countGenesOverlaps(deepblue_query_ops, new deepblue_1.Name(gene_model_name), status).subscribe((results) => {
                let rr = [];
                for (let i = 0; i < results.length; i++) {
                    let result = results[i];
                    let resultObj = new operations_1.DeepBlueMiddlewareOverlapResult(result.getDataName(), result.getDataQuery(), result.getFilterName(), result.getFilterQuery(), result.resultAsCount());
                    rr.push(resultObj);
                }
                status.finish(rr);
            });
        });
    }
    static enrichRegionsGoTerms(req, res, next) {
        manager_1.Manager.getComposedCommands().subscribe((cc) => {
            let queries_id = req.query["queries_id"];
            let gene_model_name = req.query["gene_model_name"];
            if (!(queries_id)) {
                res.send(["error", "queries_id is missing"]);
                return;
            }
            if (!(gene_model_name)) {
                res.send(["error", "gene_model_name is missing"]);
                return;
            }
            let status = ComposedCommandsRoutes.requestManager.startRequest();
            res.send(["okay", status.request_id.toLocaleString()]);
            if (!(Array.isArray(queries_id))) {
                queries_id = [queries_id];
            }
            let deepblue_query_ops = queries_id.map((query_id, i) => new operations_1.DeepBlueSelectData(new deepblue_1.Name(query_id), query_id, "DIVE data"));
            var ccos = cc.enrichRegionsGoTerms(deepblue_query_ops, new deepblue_1.Name(gene_model_name), status).subscribe((results) => {
                let rr = [];
                for (let i = 0; i < results.length; i++) {
                    let result = results[i];
                    let resultObj = new operations_1.DeepBlueMiddlewareGOEnrichtmentResult(result.getDataName(), gene_model_name, result.resultAsTuples());
                    rr.push(resultObj);
                }
                status.finish(rr);
            });
        });
    }
    static geneModelsByGenome(req, res, next) {
        manager_1.Manager.getComposedQueries().subscribe((cq) => {
            let genome = req.query["genome"];
            if (!(genome)) {
                res.send(["error", "genome is missing"]);
            }
            let status = ComposedCommandsRoutes.requestManager.startRequest();
            cq.geneModelsByGenome(new deepblue_1.Name(genome), status).subscribe((gene_models) => {
                res.send(["okay", gene_models]);
                status.finish(null);
            });
        });
    }
    static chromatinStatesByGenome(req, res, next) {
        manager_1.Manager.getComposedQueries().subscribe((cq) => {
            let genome = req.query["genome"];
            if (!(genome)) {
                res.send(["error", "genome is missing"]);
            }
            let status = ComposedCommandsRoutes.requestManager.startRequest();
            cq.chromatinStatesByGenome(new deepblue_1.Name(genome), status).subscribe((csss) => {
                res.send(["okay", csss]);
                status.finish(null);
            });
        });
    }
    static routes() {
        //get router
        let router;
        router = express.Router();
        router.get("/count_overlaps", this.countOverlaps);
        router.get("/count_genes_overlaps", this.countGenesOverlaps);
        router.get("/enrich_regions_go_terms", this.enrichRegionsGoTerms);
        router.get("/get_request", this.getRequest);
        router.get("/gene_models_by_genome", this.geneModelsByGenome);
        router.get("/chromatin_states_by_genome", this.chromatinStatesByGenome);
        return router;
    }
}
ComposedCommandsRoutes.requestManager = new requests_manager_1.RequestManager();
exports.ComposedCommandsRoutes = ComposedCommandsRoutes;
