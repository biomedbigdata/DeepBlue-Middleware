"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Observable_1 = require("rxjs/Observable");
const operations_1 = require("../domain/operations");
class CollectionPerGenome {
    constructor(genome, total_count, categories, epigenetic_marks) { }
}
class ComposedData {
    constructor(deepBlueService) {
        this.deepBlueService = deepBlueService;
        this.categories_epigenetic_marks = new Map();
        this.epigenetic_mark_categories = new Map();
        this.biosources_related = new Map();
    }
    load_epigenetic_marks(genome, status) {
        return this.deepBlueService.collection_experiments_count(status, "epigenetic_marks", "peaks", genome).flatMap((ems) => {
            return this.deepBlueService.infos(ems, status).map((ems) => {
                let new_categories = new Map();
                let new_categories_names = new Set();
                for (let em of ems) {
                    let category = em.get_extra_metadata_field('category');
                    if (!(category in new_categories)) {
                        new_categories[category] = new Array();
                        new_categories_names.add(category);
                    }
                    new_categories[category].push(em);
                }
                let categories_vector = Array.from(new_categories_names).sort();
                this.categories_epigenetic_marks[genome] = new_categories;
                this.epigenetic_mark_categories[genome] = categories_vector;
                return categories_vector;
            });
        });
    }
    get_epigenetic_marks_categories(genome, status) {
        if (!this.epigenetic_mark_categories.get(genome)) {
            return this.load_epigenetic_marks(genome, status);
        }
        else {
            return Observable_1.Observable.of(this.epigenetic_mark_categories[genome]);
        }
    }
    get_epigenetic_marks(genome, category, status) {
        if (!this.categories_epigenetic_marks.get(genome)) {
            return this.load_epigenetic_marks(genome, status).map(() => this.categories_epigenetic_marks[genome][category].sort());
        }
        else {
            return Observable_1.Observable.of(this.categories_epigenetic_marks[genome][category].sort());
        }
    }
    relatedBioSources(biosource, status) {
        let cached = this.biosources_related[biosource];
        if (cached) {
            return Observable_1.Observable.of(cached);
        }
        console.log('bisource', biosource);
        return this.deepBlueService.get_biosource_children(biosource, status).flatMap((cer) => {
            if (cer.status == operations_1.DeepBlueResultStatus.Error) {
                return Observable_1.Observable.of(cer);
            }
            let bss = cer.result;
            let all_bs = new Array();
            let bs_names = bss.map((bs) => bs[1]);
            // Skip the first element because it is itself
            for (let name of bs_names) {
                if (name != biosource) {
                    all_bs.push(this.relatedBioSources(name, status));
                }
            }
            if (all_bs.length == 0) {
                let r = new operations_1.DeepBlueCommandExecutionResult(operations_1.DeepBlueResultStatus.Okay, bs_names);
                this.biosources_related[biosource] = r;
                return Observable_1.Observable.of(r);
            }
            return Observable_1.Observable.forkJoin(all_bs).map((obss) => {
                let bss = obss.map((r) => r.result);
                let os = [].concat.apply([], bss).concat(bs_names);
                let s = Array.from(new Set(os)).sort();
                let r = new operations_1.DeepBlueCommandExecutionResult(operations_1.DeepBlueResultStatus.Okay, s);
                this.biosources_related[biosource] = r;
                return r;
            });
        });
    }
}
exports.ComposedData = ComposedData;
