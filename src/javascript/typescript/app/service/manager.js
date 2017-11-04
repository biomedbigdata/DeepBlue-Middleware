"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deepblue_1 = require("./deepblue");
const composed_commands_1 = require("./composed_commands");
const composed_queries_1 = require("./composed_queries");
const composed_data_1 = require("./composed_data");
const regions_enrichment_1 = require("./regions_enrichment");
const genes_1 = require("./genes");
const Observable_1 = require("rxjs/Observable");
const rxjs_1 = require("rxjs");
class Manager {
    constructor() { }
    static getDeepBlueService() {
        if (this.dbs.isInitialized()) {
            return Observable_1.Observable.of(this.dbs);
        }
        let subject = new rxjs_1.Subject();
        this.dbs.init().subscribe(() => {
            subject.next(this.dbs);
            subject.complete();
        });
        return subject.asObservable();
    }
    static getComposedCommands() {
        if (this.composed_commands) {
            return Observable_1.Observable.of(this.composed_commands);
        }
        let subject = new rxjs_1.Subject();
        this.dbs.init().subscribe(() => {
            this.composed_commands = new composed_commands_1.ComposedCommands(this.dbs);
            subject.next(this.composed_commands);
            subject.complete();
        });
        return subject.asObservable();
    }
    static getComposedQueries() {
        if (this.composed_queries) {
            return Observable_1.Observable.of(this.composed_queries);
        }
        let subject = new rxjs_1.Subject();
        this.dbs.init().subscribe(() => {
            this.composed_queries = new composed_queries_1.ComposedQueries(this.dbs);
            subject.next(this.composed_queries);
            subject.complete();
        });
        return subject.asObservable();
    }
    static getComposedData() {
        if (this.composed_data) {
            return Observable_1.Observable.of(this.composed_data);
        }
        let subject = new rxjs_1.Subject();
        this.dbs.init().subscribe(() => {
            this.composed_data = new composed_data_1.ComposedData(this.dbs);
            subject.next(this.composed_data);
            subject.complete();
        });
        return subject.asObservable();
    }
    static getGenes() {
        if (this.genes) {
            return Observable_1.Observable.of(this.genes);
        }
        let subject = new rxjs_1.Subject();
        this.dbs.init().subscribe(() => {
            this.genes = new genes_1.Genes(this.dbs);
            subject.next(this.genes);
            subject.complete();
        });
        return subject.asObservable();
    }
    static getRegionsEnrichment() {
        if (this.regions_enrichment) {
            return Observable_1.Observable.of(this.regions_enrichment);
        }
        let subject = new rxjs_1.Subject();
        this.dbs.init().subscribe(() => {
            this.regions_enrichment = new regions_enrichment_1.RegionsEnrichment(this.dbs);
            subject.next(this.regions_enrichment);
            subject.complete();
        });
        return subject.asObservable();
    }
}
Manager.dbs = new deepblue_1.DeepBlueService();
Manager.composed_commands = null;
Manager.composed_queries = null;
Manager.composed_data = null;
Manager.regions_enrichment = null;
Manager.genes = null;
exports.Manager = Manager;
