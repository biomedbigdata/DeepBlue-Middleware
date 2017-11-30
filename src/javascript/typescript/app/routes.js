"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const requests_manager_1 = require("./service/requests_manager");
const deepblue_1 = require("./domain/deepblue");
const operations_1 = require("./domain/operations");
const manager_1 = require("./service/manager");
const experiments_1 = require("./service/experiments");
const express = require("express");
const multer = require("multer");
class ComposedCommandsRoutes {
    static getRequest(req, res, next) {
        let request_id = req.query["request_id"];
        let request_data = ComposedCommandsRoutes.requestManager.getRequest(request_id);
        if (request_data.finished) {
            if (request_data.canceled) {
                res.send(["error", "request " + request_id + " was canceled"]);
            }
            else {
                res.send(["okay", request_data.getData()]);
            }
        }
        else {
            res.send(["error",
                {
                    step: request_data.getStep(),
                    total: request_data.getTotal(),
                    processed: request_data.getProcessed(),
                    partial: request_data.getPartialData()
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
            // TODO: Load the real query
            experiments_1.Experiments.info(experiments_id).subscribe((experiments) => {
                let deepblue_query_ops = queries_id.map((query_id) => new operations_1.DeepBlueSelectData(new deepblue_1.IdName(query_id, query_id), new deepblue_1.Id(query_id), "DIVE data"));
                let experiments_name = experiments.map((v) => new deepblue_1.Name(v["name"]));
                var ccos = cc.countOverlaps(deepblue_query_ops, experiments_name, filters, status).subscribe((results) => {
                    let rr = [];
                    for (let i = 0; i < results.length; i++) {
                        let result = results[i];
                        let overlapResult = new operations_1.DeepBlueMiddlewareOverlapResult(result.getDataName(), result.getDataId(), result.getFilterName(), result.getFilterQuery(), result.resultAsCount());
                        rr.push(overlapResult);
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
            // TODO: Load real Operation
            let deepblue_query_ops = queries_id.map((query_id, i) => new operations_1.DeepBlueSelectData(new deepblue_1.Name(query_id), new deepblue_1.Id(query_id), "DIVE data"));
            var ccos = cc.countGenesOverlaps(deepblue_query_ops, new deepblue_1.Name(gene_model_name), status).subscribe((results) => {
                let rr = [];
                for (let i = 0; i < results.length; i++) {
                    let result = results[i];
                    let resultObj = new operations_1.DeepBlueMiddlewareOverlapResult(result.getDataName(), result.getDataId(), result.getFilterName(), result.getFilterQuery(), result.resultAsCount());
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
            // TODO: Load real Operation
            let deepblue_query_ops = queries_id.map((query_id, i) => new operations_1.DeepBlueSelectData(new deepblue_1.Name(query_id), new deepblue_1.Id(query_id), "DIVE data"));
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
                return;
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
                return;
            }
            let status = ComposedCommandsRoutes.requestManager.startRequest();
            cq.chromatinStatesByGenome(new deepblue_1.Name(genome), status).subscribe((csss) => {
                res.send(["okay", csss.resultAsDistinct()]);
                status.finish(null);
            });
        });
    }
    static enrichmentDatabases(req, res, next) {
        manager_1.Manager.getRegionsEnrichment().subscribe((re) => {
            let genome = req.query["genome"];
            if (!(genome)) {
                res.send(["error", "genome is missing"]);
                return;
            }
            let status = ComposedCommandsRoutes.requestManager.startRequest();
            re.buildFullDatabases(status, genome).subscribe((dbs) => {
                res.send(dbs);
                status.finish(null);
            });
        });
    }
    static enrichRegionOverlap(req, res, next) {
        manager_1.Manager.getRegionsEnrichment().subscribe((re) => {
            // This function received an JSON object in the body
            let queries_id = req.body.queries_id;
            let universe_id = req.body.universe_id;
            let genome = req.body.genome;
            let datasets = req.body.datasets;
            if (!(queries_id)) {
                res.send(["error", "queries_id is missing"]);
                return;
            }
            if (!(universe_id)) {
                res.send(["error", "universe_id id is missing"]);
                return;
            }
            if (!(datasets)) {
                res.send(["error", "datasets is missing"]);
            }
            let status = ComposedCommandsRoutes.requestManager.startRequest();
            res.send(["okay", status.request_id.toLocaleString()]);
            // TODO: Load real operations
            let deepblue_query_ops = queries_id.map((query_id, i) => new operations_1.DeepBlueSelectData(new deepblue_1.Name(query_id), new deepblue_1.Id(query_id), "DIVE data"));
            var ccos = re.enrichRegionsOverlap(deepblue_query_ops, genome, universe_id, datasets, status).subscribe((results) => {
                let rr = [];
                for (let i = 0; i < results.length; i++) {
                    let result = results[i];
                    let resultObj = new operations_1.DeepBlueMiddlewareOverlapEnrichtmentResult(result.getDataName(), new deepblue_1.Id(universe_id), datasets, result.resultAsTuples());
                    rr.push(resultObj);
                }
                status.finish(rr);
            });
        });
    }
    static enrichRegionsFast(req, res, next) {
        manager_1.Manager.getRegionsEnrichment().subscribe((re) => {
            // This function received an JSON object in the body
            let query_id = req.body.query_id;
            let genome = req.body.genome;
            if (!(query_id)) {
                res.send(["error", "query_id is missing"]);
                return;
            }
            if (!(genome)) {
                res.send(["error", "genome is missing"]);
                return;
            }
            let status = ComposedCommandsRoutes.requestManager.startRequest();
            res.send(["okay", status.request_id.toLocaleString()]);
            // TODO: Load real operations
            let data_query = new operations_1.DeepBlueSelectData(new deepblue_1.Name(query_id), new deepblue_1.Id(query_id), "DIVE data");
            var ccos = re.enrichRegionsFast(data_query, genome, status).subscribe((results) => {
                let rr = [];
                for (let i = 0; i < results.length; i++) {
                    let result = results[i];
                    let resultObj = result.resultAsEnrichment();
                    rr = rr.concat(resultObj);
                }
                status.finish(rr);
            });
        });
    }
    static inputRegions(req, res, next) {
        manager_1.Manager.getDeepBlueService().subscribe((dbs) => {
            // This function received an JSON object in the body
            let genome = req.body.genome;
            let region_set = req.body.region_set;
            let datasets = req.body.datasets;
            if (!(genome)) {
                res.send(["error", "genome is missing"]);
                return;
            }
            if (!(region_set)) {
                res.send(["error", "region_set id is missing"]);
                return;
            }
            let status = ComposedCommandsRoutes.requestManager.startRequest();
            dbs.inputRegions(new deepblue_1.Name(genome), region_set, status).subscribe((op) => {
                res.send(["okay", op.queryId().id]);
            });
        });
    }
    static uploadRegions(req, res, next) {
        manager_1.Manager.getDeepBlueService().subscribe((ds) => {
            // We get only one file and return the query id of this file
            let found = false;
            for (let file in req.files) {
                let f = req.files[file];
                let genome = f.fieldname;
                let regions = f.buffer.toString('utf-8');
                let status = ComposedCommandsRoutes.requestManager.startRequest();
                ds.inputRegions(new deepblue_1.Name(genome), regions, status).subscribe((result) => {
                    res.send(["okay", result.queryId().id]);
                });
                found = true;
            }
            if (!found) {
                res.send(["error", "No file was sent."]);
            }
        });
    }
    static listGenes(req, res, next) {
        manager_1.Manager.getGenes().subscribe((genes) => {
            let gene_model = req.query["gene_model"];
            if (!(gene_model)) {
                res.send(["error", "gene_model is missing"]);
                return;
            }
            let gene_id_name = req.query["gene_id_name"];
            if (!(gene_id_name)) {
                res.send(["error", "gene_id_name is missing"]);
                return;
            }
            let status = ComposedCommandsRoutes.requestManager.startRequest();
            genes.listGeneName(gene_id_name, status, gene_model).subscribe((dbs) => {
                res.send(dbs);
                status.finish(null);
            });
        });
    }
    static queryInfo(req, res, next) {
        manager_1.Manager.getComposedCommands().subscribe((cc) => {
            let query_id = req.query["query_id"];
            if (!(query_id)) {
                res.send(["error", "query_id is missing"]);
                return;
            }
            let status = ComposedCommandsRoutes.requestManager.startRequest();
            cc.loadQuery(new deepblue_1.Id(query_id), status).subscribe((query) => {
                res.send(query);
                status.finish(null);
            });
        });
    }
    static cancel(req, res, next) {
        let id = req.query["id"];
        if (!(id)) {
            res.send(["error", "id is missing"]);
            return;
        }
        let status = ComposedCommandsRoutes.requestManager.startRequest();
        manager_1.Manager.getDeepBlueService().subscribe((dbs) => {
            console.log("going to cancel", id);
            if (id.startsWith("mw")) {
                ComposedCommandsRoutes.requestManager.cancelRequest(id);
                res.send(id);
            }
            else if (id.startsWith("r")) {
                // Usual DeepBlue Request
                dbs.cancelRequest(id, status).subscribe((response) => res.send(response));
            }
            else {
                res.send("Invalid ID: " + id);
            }
        });
    }
    static generate_track_file(req, res, next) {
        let request_id = req.query["request_id"];
        let genome = req.query["genome"];
        if (!(request_id)) {
            res.send(["error", "genome is missing"]);
            return;
        }
        if (!(genome)) {
            res.send(["error", "genome is missing"]);
            return;
        }
        let status = ComposedCommandsRoutes.requestManager.startRequest();
        manager_1.Manager.getDeepBlueService().subscribe((dbs) => {
            // TODO: create dummy query and request
            let sr = new operations_1.DeepBlueSimpleQuery(new deepblue_1.Id(""));
            let dbr = new operations_1.DeepBlueRequest(sr, request_id, "export_ucsc");
            dbs.getResult(dbr, status).subscribe((result) => {
                let regions = result.resultAsString();
                let description = "## Export of DeepBlue Regions to UCSC genome browser\n";
                let regionsSplit = regions.split("\n", 2);
                let firstLine = regionsSplit[0].split("\t");
                let position = "browser position " + firstLine[0] + ":" + firstLine[1] + "-" + firstLine[2] + "\n";
                let trackInfo = 'track name=DeepBlue Regions="' + request_id + '" visibility=2 url="deepblue.mpi-inf.mpg.de/request.php?_id=' + request_id + '"\n';
                let content = description + position + trackInfo + regions;
                res.header('Content-Type: text/plain');
                res.header('Content-Type: application/octet-stream');
                res.header('Content-Type: application/download');
                res.header('Content-Description: File Transfer');
                res.send(content);
            });
        });
    }
    static export_to_genome_browser(req, res, next) {
        let request_id = req.query["request_id"];
        let genome = req.query["genome"];
        if (!(request_id)) {
            res.send(["error", "genome is missing"]);
            return;
        }
        if (!(genome)) {
            res.send(["error", "genome is missing"]);
            return;
        }
        // Here is a shitty hardcoding stuff. I have to put in some settings, but... it is a work for the future me (or you!)
        let url = "http://deepblue.mpi-inf.mpg.de/api/composed_commands/generate_track_file?genome=" + genome + "&request_id=" + request_id;
        let encodedUrl = encodeURIComponent(url);
        var ucscLink = "http://genome.ucsc.edu/cgi-bin/hgTracks?";
        ucscLink = ucscLink + "db=" + genome;
        ucscLink = ucscLink + "&hgt.customText=" + encodedUrl;
        let page = `
    <html>
     <head>
     </head>
     <body>
      <h1>Loading request ` + request_id + ` in UCSC Genome browser<h1>
      <script type="text/javascript">
        window.open("` + ucscLink + `");
      </script>
     </body>
    </head>`;
        res.send(page);
    }
    static getEpigenomicMarksCategories(req, res, next) {
        let genome = req.query["genome"];
        if (!(genome)) {
            res.send(["error", "genome is missing"]);
            return;
        }
        let status = ComposedCommandsRoutes.requestManager.startRequest();
        manager_1.Manager.getComposedData().subscribe((cs) => {
            cs.get_epigenetic_marks_categories(genome, status).subscribe((emc) => {
                res.send(emc);
            });
        });
    }
    static getEpigenomicMarksFromCategory(req, res, next) {
        let category = req.query["category"];
        let genome = req.query["genome"];
        if (!(category)) {
            res.send(["error", "category is missing"]);
            return;
        }
        if (!(genome)) {
            res.send(["error", "genome is missing"]);
            return;
        }
        let status = ComposedCommandsRoutes.requestManager.startRequest();
        manager_1.Manager.getComposedData().subscribe((cs) => {
            cs.get_epigenetic_marks(genome, category, status).subscribe((emc) => {
                res.send(["okay", emc]);
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
        router.get("/list_genes", this.listGenes);
        router.get("/chromatin_states_by_genome", this.chromatinStatesByGenome);
        router.get("/get_enrichment_databases", this.enrichmentDatabases);
        router.get("/generate_track_file", this.generate_track_file);
        router.get("/export_to_genome_browser", this.export_to_genome_browser);
        router.get("/query_info", this.queryInfo);
        router.get("/cancel", this.cancel);
        // Composite data
        router.get("/get_epigenetic_marks_categories", this.getEpigenomicMarksCategories);
        router.get("/get_epigenetic_marks_from_category", this.getEpigenomicMarksFromCategory);
        // Post:
        router.post("/input_regions", this.inputRegions);
        router.post("/enrich_regions_overlap", this.enrichRegionOverlap);
        router.post("/enrich_regions_fast", this.enrichRegionsFast);
        // Upload code:
        var storage = multer.memoryStorage();
        var upload = multer({ storage: storage });
        router.post("/upload_regions", upload.any(), this.uploadRegions);
        return router;
    }
}
ComposedCommandsRoutes.requestManager = new requests_manager_1.RequestManager();
exports.ComposedCommandsRoutes = ComposedCommandsRoutes;
