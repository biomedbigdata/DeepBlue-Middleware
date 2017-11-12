"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RequestStatus {
    constructor(request_id) {
        this.total_to_load = 0;
        this.total_loaded = 0;
        this.finished = false;
        this.data = new Array();
        this.partialData = new Array();
        this.request_id = request_id;
    }
    reset(total) {
        this.total_to_load = total;
        this.total_loaded = 0;
        this.step = "";
        this.data = new Array();
        this.partialData = new Array();
    }
    increment() {
        this.total_loaded++;
    }
    finish(data) {
        this.finished = true;
        this.data = data;
        this.step = "Finished";
    }
    setStep(step) {
        this.step = step;
    }
    getStep() {
        return this.step;
    }
    getProcessed() {
        return this.total_loaded;
    }
    getTotal() {
        return this.total_to_load;
    }
    addPartialData(data) {
        this.partialData.push(data);
    }
    mergePartialData(data) {
        let merged = this.partialData.concat(data);
        merged.sort((a, b) => a['p_value_log'] - b['p_value_log']);
        let position = 0;
        let value = merged[0]['p_value_log'];
        for (let i = 0; i < merged.length; i++) {
            if (merged[i]['p_value_log'] != value) {
                position = i;
                value = merged[i]['p_value_log'];
            }
            merged[i]['log_rank'] = position + 1;
        }
        merged.sort((a, b) => a['odds_ratio'] - b['odds_ratio']);
        position = 0;
        value = merged[0]['odds_ratio'];
        for (let i = 0; i < merged.length; i++) {
            if (merged[i]['odds_ratio'] != value) {
                position = i;
                value = merged[i]['odds_ratio'];
            }
            merged[i]['odd_rank'] = position + 1;
        }
        merged.sort((a, b) => a['support'] - b['support']);
        position = 0;
        value = merged[0]['support'];
        for (let i = 0; i < merged.length; i++) {
            if (merged[i]['support'] != value) {
                position = i;
                value = merged[i]['support'];
            }
            merged[i]['support_rank'] = position + 1;
        }
        for (let ds of merged) {
            ds['mean_rank'] = ds['log_rank'] + ds['odd_rank'] + ds['support_rank'];
            ds['max_rank'] = Math.max(ds['log_rank'], ds['odd_rank'], ds['support_rank']);
        }
        merged.sort((a, b) => a['mean_rank'] - b['mean_rank']);
        console.log(merged);
        this.partialData = merged;
    }
    getPartialData() {
        return this.partialData;
    }
    setData(data) {
        this.partialData = [];
        this.data = data;
    }
    getData() {
        return this.data;
    }
    getText() {
        return `${this.step} : ${this.total_loaded}/${this.total_to_load} (${Math.ceil(this.total_loaded * 100 / this.total_to_load)}%)`;
    }
}
exports.RequestStatus = RequestStatus;
