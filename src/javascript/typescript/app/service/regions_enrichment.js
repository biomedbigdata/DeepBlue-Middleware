"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Observable_1 = require("rxjs/Observable");
const rxjs_1 = require("rxjs");
class RegionsEnrichment {
    constructor(deepBlueService) {
        this.deepBlueService = deepBlueService;
    }
    listExperiments(request_status, epigenetic_mark) {
        return this.deepBlueService.list_experiments(request_status, "peaks", epigenetic_mark).map(((experiments) => [epigenetic_mark, experiments.map((experiment) => experiment.name)]));
    }
    listExperimentsMany(request_status, epigenetic_marks) {
        let observableBatch = [];
        epigenetic_marks.forEach((epigenetic_mark) => {
            observableBatch.push(this.listExperiments(request_status, epigenetic_mark));
        });
        return Observable_1.Observable.forkJoin(observableBatch);
    }
    buildFullDatabases(request_status, genome) {
        let pollSubject = new rxjs_1.Subject();
        this.deepBlueService.collection_experiments_count(request_status, "epigenetic_marks", "peaks", genome).subscribe((ems) => {
            let histone_marks_names = ems.map((id_name) => id_name.name);
            this.listExperimentsMany(request_status, histone_marks_names).subscribe((dbs) => {
                pollSubject.next(dbs.filter((em) => {
                    return em[1].length > 0;
                }));
                pollSubject.complete();
            });
        });
        return pollSubject.asObservable();
    }
    enrichRegionsOverlap(request_status, query_id, universe_id, datasets) {
        return this.deepBlueService.enrich_regions_overlap(query_id, universe_id, datasets, request_status);
    }
}
exports.RegionsEnrichment = RegionsEnrichment;
