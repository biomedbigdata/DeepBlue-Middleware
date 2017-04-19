"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
var experiments_cache = require('../../../experiments_cache');
var cache = experiments_cache["cache"];
class Experiments {
    static info(ids) {
        let s = new rxjs_1.Subject();
        cache.infos(ids, "anonymous_key").then((data) => {
            s.next(data);
            s.complete();
        });
        return s.asObservable();
    }
}
exports.Experiments = Experiments;
