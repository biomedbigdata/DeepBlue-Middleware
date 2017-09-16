import { ComposedQueries } from './service/composed_queries';
import { RequestStatus } from './domain/status';
import { RequestManager } from './service/requests_manager';

import {
  FullGeneModel,
  FullMetadata,
  IdName,
  Name,
  Gene
} from './domain/deepblue';

import {
  DeepBlueMiddlewareGOEnrichtmentResult,
  DeepBlueMiddlewareOverlapResult,
  DeepBlueOperation,
  DeepBlueRequest,
  DeepBlueResult,
  DeepBlueSelectData,
  FilterParameter,
  DeepBlueSimpleQuery
} from './domain/operations';

import { Router } from 'express';

import { Utils } from './service/utils';

import { Manager } from './service/manager';
import { RegionsEnrichment } from './service/regions_enrichment';
import { ComposedCommands } from './service/composed_commands';
import { Experiments } from './service/experiments';
import { Genes } from "./service/genes";

const composed_commands: Router = Router();

import * as express from 'express';
import { DeepBlueService } from 'app/service/deepblue';

export class ComposedCommandsRoutes {

  private static requestManager = new RequestManager();


  private static getRequest(req: express.Request, res: express.Response, next: express.NextFunction) {
    let request_id = req.query["request_id"];

    let request_data: RequestStatus = ComposedCommandsRoutes.requestManager.getRequest(request_id);

    console.log("hereeee", request_data);
    if (request_data.finished) {
      res.send(["okay", request_data.getData()]);
    } else {
      res.send(["error",
        {
          step: request_data.getStep(),
          total: request_data.getTotal(),
          processed: request_data.getProcessed()
        }
      ]);
    }
  }

  private static countOverlaps(req: express.Request, res: express.Response, next: express.NextFunction) {
    Manager.getComposedCommands().subscribe((cc: ComposedCommands) => {

      let queries_id = req.query["queries_id"];
      let experiments_id = req.query["experiments_id"];
      let filters = req.query["filters"];

      if (filters) {
        filters = JSON.parse(filters).map((f) => FilterParameter.fromObject(f));
      } else {
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

      Experiments.info(experiments_id).subscribe((experiments: Object[]) => {
        let deepblue_query_ops: DeepBlueOperation[] =
          queries_id.map((query_id: string, i: number) => new DeepBlueSelectData(new Name(query_id), query_id, "DIVE data"));
        let experiments_name: Name[] = experiments.map((v: Object) => new Name(v["name"]));

        var ccos = cc.countOverlaps(deepblue_query_ops, experiments_name, filters, status).subscribe((results: DeepBlueResult[]) => {
          let rr = [];
          for (let i = 0; i < results.length; i++) {
            let result: DeepBlueResult = results[i];
            let resultObj = new DeepBlueMiddlewareOverlapResult(result.getDataName(), result.getDataQuery(),
              result.getFilterName(), result.getFilterQuery(),
              result.resultAsCount());
            rr.push(resultObj);
          }
          status.finish(rr);
        });

      });
    });

  }

  private static countGenesOverlaps(req: express.Request, res: express.Response, next: express.NextFunction) {
    Manager.getComposedCommands().subscribe((cc: ComposedCommands) => {

      let queries_id = req.query["queries_id"];
      let gene_model_name: string = req.query["gene_model_name"];

      let status = ComposedCommandsRoutes.requestManager.startRequest();

      res.send(["okay", status.request_id.toLocaleString()]);

      if (!(Array.isArray(queries_id))) {
        queries_id = [queries_id];
      }

      let deepblue_query_ops: DeepBlueOperation[] =
        queries_id.map((query_id: string, i: number) => new DeepBlueSelectData(new Name(query_id), query_id, "DIVE data"));

      var ccos = cc.countGenesOverlaps(deepblue_query_ops, new Name(gene_model_name), status).subscribe((results: DeepBlueResult[]) => {
        let rr = [];
        for (let i = 0; i < results.length; i++) {
          let result: DeepBlueResult = results[i];
          let resultObj = new DeepBlueMiddlewareOverlapResult(result.getDataName(), result.getDataQuery(),
            result.getFilterName(), result.getFilterQuery(),
            result.resultAsCount());
          rr.push(resultObj);
        }
        status.finish(rr);
      });

    });
  }


  private static enrichRegionsGoTerms(req: express.Request, res: express.Response, next: express.NextFunction) {
    Manager.getComposedCommands().subscribe((cc: ComposedCommands) => {

      let queries_id = req.query["queries_id"];
      let gene_model_name: string = req.query["gene_model_name"];

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

      let deepblue_query_ops: DeepBlueOperation[] =
        queries_id.map((query_id: string, i: number) => new DeepBlueSelectData(new Name(query_id), query_id, "DIVE data"));

      var ccos = cc.enrichRegionsGoTerms(deepblue_query_ops, new Name(gene_model_name), status).subscribe((results: DeepBlueResult[]) => {
        let rr = [];
        for (let i = 0; i < results.length; i++) {
          let result: DeepBlueResult = results[i];
          let resultObj = new DeepBlueMiddlewareGOEnrichtmentResult(result.getDataName(), gene_model_name, result.resultAsTuples());
          rr.push(resultObj);
        }
        status.finish(rr);
      });

    });
  }


  private static geneModelsByGenome(req: express.Request, res: express.Response, next: express.NextFunction) {
    Manager.getComposedQueries().subscribe((cq: ComposedQueries) => {

      let genome: string = req.query["genome"];

      if (!(genome)) {
        res.send(["error", "genome is missing"]);
        return;
      }

      let status = ComposedCommandsRoutes.requestManager.startRequest();
      cq.geneModelsByGenome(new Name(genome), status).subscribe((gene_models: FullGeneModel[]) => {
        res.send(["okay", gene_models]);
        status.finish(null);
      });
    });
  }

  private static chromatinStatesByGenome(req: express.Request, res: express.Response, next: express.NextFunction) {
    Manager.getComposedQueries().subscribe((cq: ComposedQueries) => {

      let genome: string = req.query["genome"];

      if (!(genome)) {
        res.send(["error", "genome is missing"]);
        return;
      }

      let status = ComposedCommandsRoutes.requestManager.startRequest();
      cq.chromatinStatesByGenome(new Name(genome), status).subscribe((csss: string[]) => {
        res.send(["okay", csss]);
        status.finish(null);
      });
    });
  }

  private static enrichmentDatabases(req: express.Request, res: express.Response, next: express.NextFunction) {
    Manager.getRegionsEnrichment().subscribe((re: RegionsEnrichment) => {

      let genome: string = req.query["genome"];

      if (!(genome)) {
        res.send(["error", "genome is missing"]);
        return;
      }

      let status = ComposedCommandsRoutes.requestManager.startRequest();
      re.buildDatabases(status, genome).subscribe((dbs: [string, string[]][]) => {
        res.send(dbs);
        status.finish(null);
      });
    });
  }

  private static enrichRegions(req: express.Request, res: express.Response, next: express.NextFunction) {
    Manager.getRegionsEnrichment().subscribe((re: RegionsEnrichment) => {

      let query_id: string = req.query["query_id"];
      let universe_id: string = req.query["universe_id"];
      let genome: string = req.query["genome"];

      if (!(genome)) {
        res.send(["error", "genome is missing"]);
        return;
      }


      if (!(query_id)) {
        res.send(["error", "request id is missing"]);
        return;
      }

      let status = ComposedCommandsRoutes.requestManager.startRequest();
      re.buildDatabases(status, genome).subscribe((dbs: [string, string[]][]) => {
        res.send(dbs);
        status.finish(null);
      });
    });
  }

  private static listGenes(req: express.Request, res: express.Response, next: express.NextFunction) {
    Manager.getGenes().subscribe((genes: Genes) => {

      let gene_model: string = req.query["gene_model"];
      if (!(gene_model)) {
        res.send(["error", "gene_model is missing"]);
        return;
      }
      let gene_id_name: string = req.query["gene_id_name"];
      if (!(gene_id_name)) {
        res.send(["error", "gene_id_name is missing"]);
        return;
      }

      let status = ComposedCommandsRoutes.requestManager.startRequest();
      genes.listGeneName(gene_id_name, status, gene_model).subscribe((dbs: Gene[]) => {
        res.send(dbs);
        status.finish(null);
      });
    });
  }

  private static generate_track_file(req: express.Request, res: express.Response, next: express.NextFunction) {

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

    let status = ComposedCommandsRoutes.requestManager.startRequest();

    Manager.getDeepBlueService().subscribe((dbs: DeepBlueService) => {
      let sr = new DeepBlueSimpleQuery("");
      let dbr = new DeepBlueRequest(sr, request_id, "export_ucsc");
      dbs.getResult(dbr, status).subscribe((result: DeepBlueResult) => {
        let regions = result.resultAsString();

        let description = "## Export of DeepBlue Regions to UCSC genome browser\n";
        let regionsSplit = regions.split("\n", 2);
        let firstLine = regionsSplit[0].split("\t");
        let position = "browser position " + firstLine[0] + ":" + firstLine[1] + "-" + firstLine[2] + "\n";
        let trackInfo = 'track name=EpiExplorer description="' + request_id + '" visibility=2 url="deepblue.mpi-inf.mpg.de/request.php?_id=' + request_id + '"\n';

        let content = description + position + trackInfo + regions;

        res.header('Content-Type: text/plain');
        res.header('Content-Type: application/octet-stream');
        res.header('Content-Type: application/download');
        res.header('Content-Description: File Transfer');

        res.send(content);
      });
    });
  }

  private static export_to_genome_browser(req: express.Request, res: express.Response, next: express.NextFunction) {

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


    // Here is a shitty hardcoding stuff. I have to put in some settings, but... it is a work for the future me (or you!)
    let url = "http://deepblue.mpi-inf.mpg.de/api/composed_commands/export?genome="+genome+"&request_id="+request_id;
    let encodedUrl = encodeURIComponent(url);
    var ucscLink = "http://genome.ucsc.edu/cgi-bin/hgTracks?";
    ucscLink = ucscLink + "db=" + genome
    ucscLink = ucscLink + "&hgt.customText=" + encodedUrl;

    let page = `
    <html>
     <head>
     </head>
     <body>
      <h1>Loading request ` + request_id + ` in UCSC Genome browser<h1>
      <script type="text/javascript">
        window.open("`+ucscLink+`");
      </script>
     </body>
    </head>`

    res.send(page)
  }

  public static routes(): express.Router {
    //get router
    let router: express.Router;
    router = express.Router();

    router.get("/count_overlaps", this.countOverlaps);
    router.get("/count_genes_overlaps", this.countGenesOverlaps);
    router.get("/enrich_regions_go_terms", this.enrichRegionsGoTerms);
    router.get("/get_request", this.getRequest)
    router.get("/gene_models_by_genome", this.geneModelsByGenome);
    router.get("/chromatin_states_by_genome", this.chromatinStatesByGenome);
    router.get("/get_enrichment_databases", this.enrichmentDatabases);
    router.get("/list_genes", this.listGenes);
    router.get("/generate_track_file", this.generate_track_file);
    router.get("/export_to_genome_browser", this.export_to_genome_browser);

    return router;
  }

}
