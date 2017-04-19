import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs";

var experiments_cache = require('../../../experiments_cache');
var cache = experiments_cache["cache"];
export class Experiments {
  static info(ids: string[]): Observable<Object> {

    let s = new Subject<Object[]>();

    cache.infos(ids, "anonymous_key").then((data) => {
      s.next(data);
      s.complete();
    });

    return s.asObservable();
  }
}

