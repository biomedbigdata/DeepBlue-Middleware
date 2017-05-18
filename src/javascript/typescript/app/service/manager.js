"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const composed_commands_1 = require("./composed_commands");
const deepblue_1 = require("./deepblue");
const composed_queries_1 = require("./composed_queries");
const Observable_1 = require("rxjs/Observable");
const rxjs_1 = require("rxjs");
class Manager {
    constructor() { }
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
}
Manager.dbs = new deepblue_1.DeepBlueService();
Manager.composed_commands = null;
Manager.composed_queries = null;
exports.Manager = Manager;
