import { Name } from './domain/deepblue';
import { DeepBlueOperation, DeepBlueRequest, DeepBlueResult } from './domain/operations';
import { Router } from 'express';

import { DeepBlueService } from './service/deepblue';

import { Manager } from './service/composed_commands';
import { ComposedCommands } from './service/composed_commands';
import { Experiments } from './service/experiments';

const composed_commands: Router = Router();

import * as express from 'express';

export class ComposedCommandsRoutes {

  private static countOverlaps(req: express.Request, res: express.Response, next: express.NextFunction) {
    Manager.getComposedCommands().subscribe((cc: ComposedCommands) => {

      let queries_id = req.query["queries_id"];
      let experiments_id = req.query["experiments_id"];

      if (!(Array.isArray(queries_id))) {
        queries_id = [queries_id];
      }

      if (!(Array.isArray(experiments_id))) {
        experiments_id = [experiments_id];
      }

      Experiments.info(experiments_id).subscribe((experiments: Object[]) => {
        let deepblue_query_ops : DeepBlueOperation[] =
          queries_id.map((query_id: string, i : number) => new DeepBlueOperation(new Name(i.toLocaleString()), query_id, "DIVE data"));

        let experiments_name : Name[] = experiments.map((v: Object) => new Name(v["name"]));
        console.log(experiments_name);

        cc.countOverlaps(deepblue_query_ops, experiments_name).subscribe((result: DeepBlueResult[]) => {
          console.log(result);
          res.send(["okay", result]);
        });

      });
    });
  }

  public static routes(): express.Router {
    //get router
    let router: express.Router;
    router = express.Router();

    router.get("/count_overlaps", this.countOverlaps);

    return router;
  }

}
