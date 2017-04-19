"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deepblue_1 = require("./domain/deepblue");
const operations_1 = require("./domain/operations");
const express_1 = require("express");
const composed_commands_1 = require("./service/composed_commands");
const experiments_1 = require("./service/experiments");
const composed_commands = express_1.Router();
const express = require("express");
class ComposedCommandsRoutes {
    static countOverlaps(req, res, next) {
        composed_commands_1.Manager.getComposedCommands().subscribe((cc) => {
            let queries_id = req.query["queries_id"];
            let experiments_id = req.query["experiments_id"];
            if (!(Array.isArray(queries_id))) {
                queries_id = [queries_id];
            }
            if (!(Array.isArray(experiments_id))) {
                experiments_id = [experiments_id];
            }
            experiments_1.Experiments.info(experiments_id).subscribe((experiments) => {
                let deepblue_query_ops = queries_id.map((query_id, i) => new operations_1.DeepBlueOperation(new deepblue_1.Name(i.toLocaleString()), query_id, "DIVE data"));
                let experiments_name = experiments.map((v) => new deepblue_1.Name(v["name"]));
                console.log(experiments_name);
                cc.countOverlaps(deepblue_query_ops, experiments_name).subscribe((result) => {
                    console.log(result);
                    res.send(["okay", result]);
                });
            });
        });
    }
    static routes() {
        //get router
        let router;
        router = express.Router();
        router.get("/count_overlaps", this.countOverlaps);
        return router;
    }
}
exports.ComposedCommandsRoutes = ComposedCommandsRoutes;
