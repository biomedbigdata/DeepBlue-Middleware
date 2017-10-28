"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const operations_1 = require("../domain/operations");
const Observable_1 = require("rxjs/Observable");
const rxjs_1 = require("rxjs");
class RegionsEnrichment {
    constructor(deepBlueService) {
        this.deepBlueService = deepBlueService;
    }
    getChromatinStates(request_status, genome) {
        return this.deepBlueService.select_regions_from_metadata(genome, "peaks", "Chromatin State Segmentation", null, null, null, null, request_status).flatMap((op) => {
            return this.deepBlueService.distinct_column_values(op, "NAME", request_status);
        });
    }
    buildChromatinStatesQueries(request_status, genome) {
        let response = new rxjs_1.Subject();
        Observable_1.Observable.forkJoin([
            this.getChromatinStates(request_status, genome),
            this.deepBlueService.list_experiments(request_status, "peaks", "Chromatin State Segmentation", genome)
        ]).subscribe((subs) => {
            let states = subs[0].resultAsDistinct();
            let state_names = Object.keys(states);
            let experiments = subs[1];
            let total_processed = 0;
            let exp_states_obs = experiments.map((experiment) => {
                return this.deepBlueService.selectExperiment(experiment, request_status)
                    .flatMap((exp_op) => {
                    return this.deepBlueService.query_cache(exp_op, request_status);
                })
                    .flatMap((exp_cached) => {
                    let filter_queries = new Array();
                    for (let state of state_names) {
                        let filter = new operations_1.FilterParameter("NAME", "==", state, "string");
                        let filter_op = this.deepBlueService.filter_regions(exp_cached, filter, request_status);
                        filter_queries.push(filter_op);
                    }
                    return Observable_1.Observable.forkJoin(filter_queries).map((filters) => {
                        let exp_filter_id = new Array();
                        for (let filter of filters) {
                            let exp_name = filter.getDataName();
                            let filter_name = filter._params.value;
                            let q_id = filter.queryId().id;
                            exp_filter_id.push([exp_name, filter_name, q_id]);
                        }
                        return exp_filter_id;
                    });
                });
            });
            Observable_1.Observable.forkJoin(exp_states_obs).subscribe((filters) => {
                //let states = new Object<string, Array<string, string]>();
                let states = {};
                for (let exp_filters of filters) {
                    for (let filter of exp_filters) {
                        if (!(filter[1] in states)) {
                            states[filter[1]] = new Array();
                        }
                        states[filter[1]].push([filter[0], filter[2]]);
                    }
                }
                let arr_filter = Object.keys(states).map((state) => {
                    return [state, states[state]];
                });
                console.log(JSON.stringify(arr_filter));
                response.next(["Chomatin States Segmentation", arr_filter]);
                response.complete();
            });
        });
        return response.asObservable();
    }
    ;
    listExperiments(request_status, epigenetic_mark) {
        return this.deepBlueService.list_experiments(request_status, "peaks", epigenetic_mark).map(((experiments) => [epigenetic_mark, experiments.map((experiment) => experiment.name)]));
    }
    //  {[key: string]: [string, string][]};
    listExperimentsMany(request_status, epigenetic_marks, genome) {
        let observableBatch = [];
        epigenetic_marks.forEach((epigenetic_mark) => {
            let o;
            if (epigenetic_mark == "Chromatin State Segmentation") {
                o = this.buildChromatinStatesQueries(request_status, genome);
            }
            else {
                o = this.listExperiments(request_status, epigenetic_mark);
            }
            observableBatch.push(o);
        });
        return Observable_1.Observable.forkJoin(observableBatch);
    }
    buildFullDatabases(request_status, genome) {
        let pollSubject = new rxjs_1.Subject();
        this.deepBlueService.collection_experiments_count(request_status, "epigenetic_marks", "peaks", genome).subscribe((ems) => {
            let histone_marks_names = ems.map((id_name) => id_name.name);
            this.listExperimentsMany(request_status, histone_marks_names, genome).subscribe((dbs) => {
                pollSubject.next(dbs.filter((em) => {
                    return em && em[1].length > 0;
                }));
                pollSubject.complete();
            });
        });
        return pollSubject.asObservable();
    }
    enrichRegionsOverlap(data_query_id, universe_id, datasets, status) {
        var start = new Date().getTime();
        let total = data_query_id.length * data_query_id.length * 3;
        status.reset(total);
        let response = new rxjs_1.Subject();
        let observableBatch = [];
        data_query_id.forEach((current_op) => {
            let o = this.deepBlueService.enrich_regions_overlap(current_op, universe_id, datasets, status);
            observableBatch.push(o);
        });
        return Observable_1.Observable.forkJoin(observableBatch);
    }
}
exports.RegionsEnrichment = RegionsEnrichment;
