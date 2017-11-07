"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Observable_1 = require("rxjs/Observable");
class CollectionPerGenome {
    constructor(genome, total_count, categories, epigenetic_marks) { }
}
class ComposedData {
    constructor(deepBlueService) {
        this.deepBlueService = deepBlueService;
        this.categories_epigenetic_marks = new Map();
        this.epigenetic_mark_categories = new Map();
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
}
exports.ComposedData = ComposedData;
