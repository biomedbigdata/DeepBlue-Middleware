import { ComposedQueries } from './service/composed_queries';
import { RequestStatus } from './domain/status';
import { RequestManager } from './service/requests_manager';
import { FullGeneModel, FullMetadata, IdName, Name } from './domain/deepblue';
import {
  DeepBlueMiddlewareGOEnrichtmentResult,
  DeepBlueMiddlewareOverlapResult,
  DeepBlueOperation,
  DeepBlueRequest,
  DeepBlueResult,
  DeepBlueSelectData
} from './domain/operations';
import { Router } from 'express';

import { Utils } from './service/utils';

import { DeepBlueService } from './service/deepblue';

import { Manager } from './service/manager';
import { ComposedCommands } from './service/composed_commands';
import { Experiments } from './service/experiments';


const composed_commands: Router = Router();

import * as express from 'express';

export class ComposedCommandsRoutes {

  private static requestManager = new RequestManager();


  private static getRequest(req: express.Request, res: express.Response, next: express.NextFunction) {
    let request_id = req.query["request_id"];

    let request_data: RequestStatus = ComposedCommandsRoutes.requestManager.getRequest(request_id);

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

        var ccos = cc.countOverlaps(deepblue_query_ops, experiments_name, status).subscribe((results: DeepBlueResult[]) => {
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


  private static calculateEnrichment(req: express.Request, res: express.Response, next: express.NextFunction) {
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

      var ccos = cc.calculateEnrichment(deepblue_query_ops, new Name(gene_model_name), status).subscribe((results: DeepBlueResult[]) => {
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
      }

      let status = ComposedCommandsRoutes.requestManager.startRequest();
      cq.geneModelsByGenome(new Name(genome), status).subscribe((gene_models: FullGeneModel[]) => {
        res.send(["okay", gene_models]);
        status.finish(null);
      });
    });
  }

  public static routes(): express.Router {
    //get router
    let router: express.Router;
    router = express.Router();

    router.get("/count_overlaps", this.countOverlaps);
    router.get("/count_genes_overlaps", this.countGenesOverlaps);
    router.get("/calculate_enrichment", this.calculateEnrichment);
    router.get("/get_request", this.getRequest)
    router.get("/gene_models_by_genome", this.geneModelsByGenome);

    return router;
  }

}
