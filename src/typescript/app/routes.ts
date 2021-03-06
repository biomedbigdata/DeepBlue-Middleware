import { ComposedQueries } from './service/composed_queries';
import { RequestStatus } from './domain/status';
import { RequestManager } from './service/requests_manager';

import {
  FullGeneModel,
  FullMetadata,
  Name,
  Gene,
  Id
} from './domain/deepblue';

import {
  DeepBlueMiddlewareGOEnrichtmentResult,
  DeepBlueOperation,
  DeepBlueRequest,
  DeepBlueResult,
  DeepBlueMiddlewareOverlapEnrichtmentResult,
  DeepBlueDataParameter,
  DeepBlueFilterParameters
} from './domain/operations';

import { Manager } from './service/manager';
import { RegionsEnrichment } from './service/regions_enrichment';
import { ComposedCommands } from './service/composed_commands';
import { Experiments } from './service/experiments';
import { Genes } from "./service/genes";

import * as express from 'express';
import * as multer from 'multer';

import { DeepBlueService } from 'app/service/deepblue';
import { ComposedData } from 'app/service/composed_data';
import { Observable } from 'rxjs/Observable';

export class ComposedCommandsRoutes {

  private static requestManager = new RequestManager();


  private static getRequest(req: express.Request, res: express.Response, next: express.NextFunction) {
    let request_id = req.query["request_id"];

    let request_data: RequestStatus = ComposedCommandsRoutes.requestManager.getRequest(request_id);

    if (request_data.finished) {

      if (request_data.canceled) {
        res.send(["error", "request " + request_id + " was canceled"]);

      } else {
        res.send(["okay", request_data.getData()]);
      }

    } else {
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

  private static countOverlaps(req: express.Request, res: express.Response, next: express.NextFunction) {
    Manager.getComposedCommands().subscribe((cc: ComposedCommands) => {

      let queries_id: string[] = req.body.queries_id;
      let experiments_id: string[] = req.body.experiments_id;
      let filters: string = req.body.filters;

      let filterObj : DeepBlueFilterParameters[] = [];
      if (filters) {
        filterObj = JSON.parse(filters).map((f) => DeepBlueFilterParameters.fromObject(f));
      } else {
        filterObj = [];
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
      Experiments.info(experiments_id).subscribe((experiments: Object[]) => {
        let deepblue_query_ops: DeepBlueOperation[] =
          queries_id.map((query_id: string) => new DeepBlueOperation(new DeepBlueDataParameter(query_id), new Id(query_id), "DIVE data"));
        let experiments_name: Name[] = experiments.map((v: Object) => new Name(v["name"]));

        var ccos = cc.countOverlaps(deepblue_query_ops, experiments_name, filterObj, status).subscribe((results: DeepBlueResult[]) => {
          let rr = [];
          for (let i = 0; i < results.length; i++) {
            let result: DeepBlueResult = results[i];
            rr.push(result);
          }
          status.finish(rr);
        });

      });
    });

  }

  private static countGenesOverlaps(req: express.Request, res: express.Response, next: express.NextFunction) {
    Manager.getComposedCommands().subscribe((cc: ComposedCommands) => {
      let queries_id: string[] = req.body.queries_id;
      let gene_model_name: string = req.body.gene_model_name;
      let filters: object[] = JSON.parse(req.body.filters);

      let status = ComposedCommandsRoutes.requestManager.startRequest();

      res.send(["okay", status.request_id.toLocaleString()]);

      if (!(Array.isArray(queries_id))) {
        queries_id = [queries_id];
      }

      // TODO: Load real Operation
      let deepblue_query_ops: DeepBlueOperation[] =
        queries_id.map((query_id: string, i: number) => new DeepBlueOperation(new DeepBlueDataParameter(query_id), new Id(query_id), "DIVE data"));

      var ccos = cc.countGenesOverlaps(deepblue_query_ops, new Name(gene_model_name), filters, status).subscribe((results: DeepBlueResult[][]) => {
        let rr = [];
        for (let i = 0; i < results.length; i++) {
          let result: DeepBlueResult[] = results[i];
          rr.push(result);
        }
        status.finish(rr);
      });
    });
  }


  private static enrichRegionsGoTerms(req: express.Request, res: express.Response, next: express.NextFunction) {
    Manager.getRegionsEnrichment().subscribe((re: RegionsEnrichment) => {

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

      // TODO: Load real Operation
      let deepblue_query_ops: DeepBlueOperation[] =
        queries_id.map((query_id: string, i: number) => new DeepBlueOperation(new DeepBlueDataParameter(query_id), new Id(query_id), "DIVE data"));

      var ccos = re.enrichRegionsGoTerms(deepblue_query_ops, new Name(gene_model_name), status).subscribe((results: DeepBlueResult[]) => {
        let rr = [];
        for (let i = 0; i < results.length; i++) {
          let result: DeepBlueResult = results[i];
          let resultObj = new DeepBlueMiddlewareGOEnrichtmentResult(result.getData().name(), gene_model_name, result.resultAsTuples());
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
      cq.chromatinStatesByGenome(new Name(genome), status).subscribe((csss: DeepBlueResult) => {
        res.send(["okay", csss.resultAsDistinct()]);
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
      re.buildFullDatabases(status, genome).subscribe((dbs: [string, string[]][]) => {
        res.send(dbs);
        status.finish(null);
      });
    });
  }

  private static enrichRegionOverlap(req: express.Request, res: express.Response, next: express.NextFunction) {
    Manager.getRegionsEnrichment().subscribe((re: RegionsEnrichment) => {

      // This function received an JSON object in the body

      let queries_id: string[] = req.body.queries_id;
      let universe_id: string = req.body.universe_id;
      let genome: string = req.body.genome;
      let datasets: Object = req.body.datasets;

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
      let deepblue_query_ops =
        queries_id.map((query_id: string, i: number) => new DeepBlueOperation(new DeepBlueDataParameter(query_id), new Id(query_id), "DIVE data"));


      var ccos = re.enrichRegionsOverlap(deepblue_query_ops, genome, universe_id, datasets, status).subscribe((results: DeepBlueResult[]) => {
        let rr = [];
        for (let i = 0; i < results.length; i++) {
          let result: DeepBlueResult = results[i];
          let resultObj = new DeepBlueMiddlewareOverlapEnrichtmentResult(result.getData().name(), new Id(universe_id), datasets, result.resultAsTuples());
          rr.push(resultObj);
        }
        status.finish(rr);
      });
    });
  }


  private static enrichRegionsFast(req: express.Request, res: express.Response, next: express.NextFunction) {
    Manager.getRegionsEnrichment().subscribe((re: RegionsEnrichment) => {

      // This function received an JSON object in the body
      let query_id: string = req.body.query_id;
      let genome: string = req.body.genome;

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
      let data_query = new DeepBlueOperation(new DeepBlueDataParameter(query_id), new Id(query_id), "DIVE data");

      var ccos = re.enrichRegionsFast(data_query, genome, status).subscribe((results: DeepBlueResult[]) => {
        let rr = [].concat(...results.map((result) => result.resultAsEnrichment()));
        status.finish(rr);
      });
    });
  }

  private static inputRegions(req: express.Request, res: express.Response, next: express.NextFunction) {
    Manager.getDeepBlueService().subscribe((dbs: DeepBlueService) => {

      // This function received an JSON object in the body

      let genome: string = req.body.genome;
      let region_set: string = req.body.region_set;
      let datasets: Object = req.body.datasets;

      if (!(genome)) {
        res.send(["error", "genome is missing"]);
        return;
      }

      if (!(region_set)) {
        res.send(["error", "region_set id is missing"]);
        return;
      }

      let status = ComposedCommandsRoutes.requestManager.startRequest();
      dbs.inputRegions(new Name(genome), region_set, status).subscribe((op) => {
        if (op.dataType() == "error") {
          res.send(["error", op.text()])
        } else {
          res.send(["okay", op.id().id]);
        }
      });
    });
  }


  private static getRelatedBioSources(req: express.Request, res: express.Response, next: express.NextFunction) {
    Manager.getComposedData().subscribe((cd: ComposedData) => {

      let biosource = req.query["biosource"];
      let genome = req.query["genome"];

      if (!(biosource)) {
        res.send(["error", "biosource is missing"]);
        return;
      }

      if (!(genome)) {
        res.send(["error", "genome is missing"]);
        return;
      }

      let status = ComposedCommandsRoutes.requestManager.startRequest();
      cd.relatedBioSources(biosource, genome, status).subscribe((bss) => {
        res.send([bss.status, bss.result]);
      });
    });
  }

  private static uploadRegions(req: express.Request, res: express.Response, next: express.NextFunction) {
    Manager.getDeepBlueService().subscribe((ds: DeepBlueService) => {

      // We get only one file and return the query id of this file
      let found = false;
      for (let file in req.files) {
        let f = req.files[file];
        let genome = f.fieldname;
        let regions = f.buffer.toString('utf-8');

        let status = ComposedCommandsRoutes.requestManager.startRequest();
        ds.inputRegions(new Name(genome), regions, status).subscribe((result) => {
          if (result.dataType() == "error") {
            res.send(["error", result.text()])
          } else {
            res.send(["okay", result.id().id]);
          }
        });
        found = true;
      }

      if (!found) {
        res.send(["error", "No file was sent."]);
      }

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

  private static queryInfo(req: express.Request, res: express.Response, next: express.NextFunction) {
    Manager.getComposedCommands().subscribe((cc: ComposedCommands) => {

      let query_id: string = req.query["query_id"];
      if (!(query_id)) {
        res.send(["error", "query_id is missing"]);
        return;
      }

      let status = ComposedCommandsRoutes.requestManager.startRequest();
      cc.loadQuery(new Id(query_id), status).subscribe((query: DeepBlueOperation) => {
        res.send(query);
        status.finish(null);
      });
    });
  }

  private static cancel(req: express.Request, res: express.Response, next: express.NextFunction) {
    let id: string = req.query["id"];
    if (!(id)) {
      res.send(["error", "id is missing"]);
      return;
    }

    let status = ComposedCommandsRoutes.requestManager.startRequest();
    Manager.getDeepBlueService().subscribe((dbs: DeepBlueService) => {
      if (id.startsWith("mw")) {
        ComposedCommandsRoutes.requestManager.cancelRequest(id);
        res.send(["okay", id]);
      } else if (id.startsWith("r")) {
        // Usual DeepBlue Request
        dbs.cancelRequest(new Id(id), status).subscribe((response) => res.send(response));
      } else {
        res.send("Invalid ID: " + id);
      }
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


    let request_id_object = new Id(request_id);
    let status = ComposedCommandsRoutes.requestManager.startRequest();

    Observable.forkJoin([Manager.getDeepBlueService(), Manager.getComposedCommands()]).subscribe(([a, b]: any[]) => {
      let dbs: DeepBlueService = a;
      let cc: ComposedCommands = b;

      dbs.info(request_id_object, status).subscribe((info) => {
        let query_id = new Id(info.get('query_id'));

        cc.loadQuery(query_id, status).subscribe((operation) => {
          let state = info.get('state');

          if (["cleared", "canceled", "processing"].indexOf(state) > -1) {

            let format = info.format();
            if (!(format)) {
              res.send("The request " + request_id + " is not a get_regions command");
              return;
            }

            dbs.getRegions(operation, format, status).subscribe((dbr) => {
              ComposedCommandsRoutes.build_track_file(dbr, dbs, status, res);
            });

          } else {
            let sr = new DeepBlueOperation(new DeepBlueDataParameter("dummy"), new Id("dummy"), "dummy");
            let dbr = new DeepBlueRequest(sr, request_id_object, "export_ucsc");
            ComposedCommandsRoutes.build_track_file(dbr, dbs, status, res);
          }
        });
      });
    });
  }

  private static build_track_file(request: DeepBlueRequest, dbs: DeepBlueService,
    status: RequestStatus, res: express.Response) {

    let request_id = request.id().id;

    dbs.getResult(request, status).subscribe((result: DeepBlueResult) => {
      let regions = result.resultAsString();

      let content = "";
      if (regions.length > 0) {

        let regions_chr_star_end = regions.split("\n").map((line) => {
          let split = line.split("\t")

          if (split.length < 3) {
            return "";
          }
          return [split[0], split[1], split[2]].join("\t");
        }).join("\n");

        let description = "## Export of DeepBlue Regions to UCSC genome browser\n";
        let regionsSplit = regions.split("\n", 2);
        let firstLine = regionsSplit[0].split("\t");
        let position = "browser position " + firstLine[0] + ":" + firstLine[1] + "-" + firstLine[2] + "\n";
        let trackInfo = 'track name=DeepBlue Regions="' + request_id + '" visibility=2 url="deepblue.mpi-inf.mpg.de/request.php?_id=' + request_id + '"\n';

        content = description + position + trackInfo + regions_chr_star_end;
      }

      res.header('Content-Type: text/plain');
      res.header('Content-Type: application/octet-stream');
      res.header('Content-Type: application/download');
      res.header('Content-Description: File Transfer');

      res.send(content);
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
    let url = "http://deepblue.mpi-inf.mpg.de/api/composed_commands/generate_track_file?genome=" + genome + "&request_id=" + request_id;
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
        window.open("`+ ucscLink + `");
      </script>
     </body>
    </head>`

    res.send(page)
  }

  private static getEpigenomicMarksCategories(req: express.Request, res: express.Response, next: express.NextFunction) {
    let genome: string = req.query["genome"];
    if (!(genome)) {
      res.send(["error", "genome is missing"]);
      return;
    }

    let status = ComposedCommandsRoutes.requestManager.startRequest();
    Manager.getComposedData().subscribe((cs: ComposedData) => {
      cs.get_epigenetic_marks_categories(genome, status).subscribe((emc: Array<string>) => {
        res.send(emc);
      });
    });
  }

  private static getEpigenomicMarksFromCategory(req: express.Request, res: express.Response, next: express.NextFunction) {
    let category: string = req.query["category"];
    let genome: string = req.query["genome"];

    if (!(category)) {
      res.send(["error", "category is missing"]);
      return;
    }

    if (!(genome)) {
      res.send(["error", "genome is missing"]);
      return;
    }

    let status = ComposedCommandsRoutes.requestManager.startRequest();
    Manager.getComposedData().subscribe((cs: ComposedData) => {
      cs.get_epigenetic_marks(genome, category, status).subscribe((emc: Array<FullMetadata>) => {
        if (!Array.isArray(emc)) {
          res.send(["error", emc]);
        } else {
          res.send(["okay", emc]);
        }
      });
    });
  }

  public static routes(): express.Router {
    //get router
    let router: express.Router;
    router = express.Router();

    router.get("/enrich_regions_go_terms", this.enrichRegionsGoTerms);
    router.get("/get_request", this.getRequest)
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

    // Biosources
    router.get("/get_related_biosources", this.getRelatedBioSources);

    // Post:
    router.post("/count_genes_overlaps", this.countGenesOverlaps);
    router.post("/count_overlaps", this.countOverlaps);
    router.post("/input_regions", this.inputRegions);
    router.post("/enrich_regions_overlap", this.enrichRegionOverlap);
    router.post("/enrich_regions_fast", this.enrichRegionsFast);

    // Upload code:
    var storage = multer.memoryStorage()
    var upload = multer({ storage: storage })
    router.post("/upload_regions", upload.any(), this.uploadRegions);

    return router;
  }

}
