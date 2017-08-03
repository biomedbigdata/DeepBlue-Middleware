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
    getHistoneModificationDatabases(request_status, genome) {
        let pollSubject = new rxjs_1.Subject();
        this.deepBlueService.list_epigenetic_marks(request_status, "Histone Modification").subscribe((histone_marks) => {
            let histone_marks_names = histone_marks.map((id_name) => id_name.name);
            console.log(histone_marks_names);
            //this.listExperimentsMany(request_status, histone_marks_names).subscribe((dbs: [string, string[]][]) => {
            //  console.log(dbs);
            //})
        });
        return Observable_1.Observable.of(null);
    }
    buildDatabases(request_status, genome) {
        "Histone Modification";
        "Transcription Factor Binding Sites";
        "Gene Expression";
        this.getHistoneModificationDatabases(request_status, genome).subscribe((value) => {
            console.log(value);
        });
        return Observable_1.Observable.of(null);
    }
}
exports.RegionsEnrichment = RegionsEnrichment;
