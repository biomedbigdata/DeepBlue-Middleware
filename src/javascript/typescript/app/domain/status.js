"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Statistics {
    static percentile(arr, p, sort) {
        if (arr.length === 0) {
            return 0;
        }
        if (p <= 0) {
            return arr[0];
        }
        if (p >= 1) {
            return arr[arr.length - 1];
        }
        if (sort) {
            arr.sort(function (a, b) { return a - b; });
        }
        const index = (arr.length - 1) * p;
        const lower = Math.floor(index);
        const upper = lower + 1;
        const weight = index % 1;
        if (upper >= arr.length) {
            return arr[lower];
        }
        return arr[lower] * (1 - weight) + arr[upper] * weight;
    }
}
exports.Statistics = Statistics;
class RequestStatus {
    constructor(request_id) {
        this.total_to_load = 0;
        this.total_loaded = 0;
        this.finished = false;
        this.data = new Array();
        this.partialData = new Array();
        this.summarizedData = null;
        this.request_id = request_id;
    }
    reset(total) {
        this.total_to_load = total;
        this.total_loaded = 0;
        this.step = "";
        this.data = new Array();
        this.partialData = new Array();
        this.summarizedData = null;
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
        let partialData = this.partialData.concat(data);
        this.partialData = partialData;
        partialData.sort((a, b) => b['p_value_log'] - a['p_value_log']);
        let position = 0;
        let value = partialData[0]['p_value_log'];
        for (let i = 0; i < partialData.length; i++) {
            if (partialData[i]['p_value_log'] != value) {
                position = i;
                value = partialData[i]['p_value_log'];
            }
            partialData[i]['log_rank'] = position + 1;
        }
        partialData.sort((a, b) => b['odds_ratio'] - a['odds_ratio']);
        position = 0;
        value = partialData[0]['odds_ratio'];
        for (let i = 0; i < partialData.length; i++) {
            if (partialData[i]['odds_ratio'] != value) {
                position = i;
                value = partialData[i]['odds_ratio'];
            }
            partialData[i]['odd_rank'] = position + 1;
        }
        partialData.sort((a, b) => b['support'] - a['support']);
        position = 0;
        value = partialData[0]['support'];
        for (let i = 0; i < partialData.length; i++) {
            if (partialData[i]['support'] != value) {
                position = i;
                value = partialData[i]['support'];
            }
            partialData[i]['support_rank'] = position + 1;
        }
        for (let ds of partialData) {
            ds['mean_rank'] = ds['log_rank'] + ds['odd_rank'] + ds['support_rank'];
            ds['max_rank'] = Math.max(ds['log_rank'], ds['odd_rank'], ds['support_rank']);
        }
        partialData.sort((a, b) => a['mean_rank'] - b['mean_rank']);
        let biosources = {};
        let ems = {};
        for (let ds of partialData) {
            let biosource = ds['biosource'];
            let em = ds['epigenetic_mark'];
            let rank = ds['mean_rank'];
            if (!(biosource in biosources)) {
                biosources[biosource] = [];
            }
            biosources[biosource].push(rank);
            if (!(em in ems)) {
                ems[em] = [];
            }
            ems[em].push(rank);
        }
        let total_bs = Object.keys(biosources).length;
        let total_em = Object.keys(ems).length;
        for (let bs in biosources) {
            const results = biosources[bs];
            let high = Number.MIN_SAFE_INTEGER;
            let low = Number.MAX_SAFE_INTEGER;
            let sum = 0;
            const values = [];
            for (const count of results) {
                if (count < low) {
                    low = count;
                }
                if (count > high) {
                    high = count;
                }
                sum += count;
                values.push(count);
            }
            values.sort((a, b) => { return a - b; });
            const mean = sum / values.length;
            const q1 = Statistics.percentile(values, 0.25);
            const q3 = Statistics.percentile(values, 0.75);
            const median = Statistics.percentile(values, 0.5);
            biosources[bs] = { low: low, q1: q1, median: median, q3: q3, high: high, mean: mean, elements: values.length };
        }
        this.summarizedData = Object.keys(biosources).map((biosource) => [biosource, biosources[biosource]]).sort((a, b) => a[1]['mean'] - b[1]['mean']);
    }
    getPartialData() {
        return this.partialData;
    }
    getSummarizedData() {
        return this.summarizedData;
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
