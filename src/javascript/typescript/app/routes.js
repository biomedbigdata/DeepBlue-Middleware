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
        console.log("hereeee", request_data);
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
                res.send(["okay", csss]);
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
            re.buildDatabases(status, genome).subscribe((dbs) => {
                res.send(dbs);
                status.finish(null);
            });
        });
    }
    static enrichRegions(req, res, next) {
        manager_1.Manager.getRegionsEnrichment().subscribe((re) => {
            let query_id = req.query["query_id"];
            let universe_id = req.query["universe_id"];
            let genome = req.query["genome"];
            if (!(genome)) {
                res.send(["error", "genome is missing"]);
                return;
            }
            if (!(query_id)) {
                res.send(["error", "request id is missing"]);
                return;
            }
            let status = ComposedCommandsRoutes.requestManager.startRequest();
            re.buildDatabases(status, genome).subscribe((dbs) => {
                res.send(dbs);
                status.finish(null);
            });
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
            console.log(gene_id_name);
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
    /*
    private static export(req: express.Request, res: express.Response, next: express.NextFunction) {
  
      let request_id: string = req.query["request_id"];
      let genome: string = req.query["genome"];
  
      if (!(request_id)) {
        res.send(["error", "genome is missing"]);
        return;
      }
  
      if (!(genome)) {
        res.send(["error", "genome is missing"]);
        return;
      }
  
      res.header('Content-Type: text/plain'); // plain text file
      res.header('Content-Type: application/octet-stream');
      res.header('Content-Type: application/download');
      res.header('Content-Description: File Transfer');
  
      var ucscLink = "http://genome.ucsc.edu/cgi-bin/hgTracks?";
      ucscLink = ucscLink + "db=" + genome
      ucscLink = ucscLink + "&hgt.customText=" + encodeURIComponent(getExportLink("UCSC"))
  
      header = "## Export of custom EpiExplorer track to UCSC genome browser\n"
  
      header += "browser position " + firstLine[0] + ":" + firstLine[1] + "-" + firstLine[2] + "\n"
      window.open(ucscLink);
  
  firstLine = regionsContent[:regionsContent.find("\n")].strip().split("\t")
  header += "browser position " + firstLine[0] + ":" + firstLine[1] + "-" + firstLine[2] + "\n"
  header += 'track name=EpiExplorer description="' + regionSet + '" visibility=2 url="http://epiexplorer.mpi-inf.mpg.de/index.php?userdatasets=' + regionSet + '"\n'
  regionsContent = header + regionsContent
  
  
  Displaying Track Hubs by URL and in sessions
  
  Once you have successfully loaded your hub, by pasting the URL to the location of your hub.txt file into the My Hubs tab of the Track Data Hubs page, you may want to consider building URLs to directly load the hub along with session settings.
  To build a URL that will load the hub directly, add "&hubUrl=" to the hgTracks CGI followed by the address of the hub.txt file. You also need to include the UCSC assembly you are displaying the hub upon such as "db=hg19". For example, here is a working link that will visualize the ENCODE AWG hub:
  http://genome.ucsc.edu/cgi-bin/hgTracks?db=hg19&hubUrl=http://ftp.ebi.ac.uk/pub/databases/ensembl/encode/integration_data_jan2011/hub.txt
  If you also want to load your hub at specific browser coordinates and with a specific set of other browser tracks (you can also set the visibility of each track in your hub), you can save your hub in a session, which are in essence "View Settings" collected in a text file (example session text files here). Sessions can be shared in different ways, please see the instructions for creating a session and saving it to a file.
  By making your session file available over the Internet, you can build a URL that will load the session automatically by adding "&hgS_loadUrlName=" to the hgTracks CGI followed by the URL location of the saved session file. The location of the saved session file should be in the same directory that holds your hub.txt file. Finally add "&hgS_doLoadUrl=submit" to the URL to inform the browser to load the session.
  There are four required variables for your URL to load a session with a hub and an example URL:
  db - name of the assembly (e.g. hg19 or mm10)
  hubUrl - URL to your track hub
  hgS_loadUrlName - URL to your session file
  hgS_doLoadUrl - value should be "submit"
  http://genome.ucsc.edu/cgi-bin/hgTracks?db=hg19&hubUrl=http://myLab.org/myHub.txt&hgS_loadUrlName=http://mySession&hgS_doLoadUrl=submit
  Another feature one can use in place of "&hubUrl=" is "&hubClear=", which will load a hub while simultaneously disconnecting or clearing, hubs located at the same location. For example adding &hubClear=http://university.edu/lab/folder/hub10.txt would connect the referenced hub10.txt while simultaneously disconnecting any hubs that might be displayed from the same http://university.edu/lab/folder/ directory (for example, hub1.txt, hub2.txt, ect.). This feature can be useful for dynamically generated hubs that might collect in the browser otherwise.
  Beyond the URL options of "&hubUrl=" and "&hubClear=" there are many other ways to link to the Browser including a list of URL optional parameters described in the the Custom Tracks User's Guide.
  
  
  
  https://genome.ucsc.edu/goldenpath/help/hgTrackHubHelp.html#Intro noo
    }
    */
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
        router.get("/get_enrichment_databases", this.enrichmentDatabases);
        router.get("/list_genes", this.listGenes);
        return router;
    }
}
ComposedCommandsRoutes.requestManager = new requests_manager_1.RequestManager();
exports.ComposedCommandsRoutes = ComposedCommandsRoutes;
