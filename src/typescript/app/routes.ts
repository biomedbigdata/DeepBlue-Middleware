import { RequestManager } from './service/requests_manager';
import { Name } from './domain/deepblue';
import {
  DeepBlueMiddlewareOverlapResult,
  DeepBlueOperation,
  DeepBlueRequest,
  DeepBlueResult,
  DeepBlueSelectData
} from './domain/operations';
import { Router } from 'express';

import { DeepBlueService } from './service/deepblue';

import { Manager } from './service/composed_commands';
import { ComposedCommands } from './service/composed_commands';
import { Experiments } from './service/experiments';

const composed_commands: Router = Router();

import * as express from 'express';

export class ComposedCommandsRoutes {

  private static requestManager = new RequestManager();


  private static getRequest(req: express.Request, res: express.Response, next: express.NextFunction) {
    let request_id = req.query["request_id"];

    let request_data = ComposedCommandsRoutes.requestManager.getRequest(request_id);

    if (request_data === "new") {
      res.send(["error", "still processing"]);
    } else {
      res.send(["okay", request_data]);
    }


  }

  private static countOverlaps(req: express.Request, res: express.Response, next: express.NextFunction) {
    Manager.getComposedCommands().subscribe((cc: ComposedCommands) => {

      let queries_id = req.query["queries_id"];
      let experiments_id = req.query["experiments_id"];

      let request_id = ComposedCommandsRoutes.requestManager.startRequest();

      res.send(["okay", request_id]);

      if (!(Array.isArray(queries_id))) {
        queries_id = [queries_id];
      }

      if (!(Array.isArray(experiments_id))) {
        experiments_id = [experiments_id];
      }

      Experiments.info(experiments_id).subscribe((experiments: Object[]) => {
        let deepblue_query_ops: DeepBlueOperation[] =
          queries_id.map((query_id: string, i: number) => new DeepBlueSelectData(new Name(i.toLocaleString()), query_id, "DIVE data"));
        let experiments_name: Name[] = experiments.map((v: Object) => new Name(v["name"]));

        var ccos = cc.countOverlaps(deepblue_query_ops, experiments_name).subscribe((results: DeepBlueResult[]) => {

          let rr = [];
          for (let i = 0; i < results.length; i++) {
            let result: DeepBlueResult = results[i];

            let resultObj = new DeepBlueMiddlewareOverlapResult(result.getDataName(), result.getDataQuery(),
              result.getFilterName(), result.getFilterQuery(),
              result.resultAsCount());
            rr.push(resultObj);
            console.log(rr);
          }

          ComposedCommandsRoutes.requestManager.storeRequest(request_id, rr);
        });

      });
    });
  }


  public static routes(): express.Router {
    //get router
    let router: express.Router;
    router = express.Router();

    router.get("/count_overlaps", this.countOverlaps);
    router.get("/get_request", this.getRequest)

    return router;
  }

}
