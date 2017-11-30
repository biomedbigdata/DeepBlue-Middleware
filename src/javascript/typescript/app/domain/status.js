"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Statistics {
    static filter(arr, dropoff_sds, sort) {
        if (sort) {
            arr.sort(function (a, b) { return a - b; });
        }
        let sum = arr.reduce((p, c) => p + c, 0);
        const mean = sum / arr.length;
        let diffs = [];
        for (let v of arr) {
            diffs.push(Math.pow(v - mean, 2));
        }
        let d = diffs.reduce((a, b) => a + b, 0);
        let sd = Math.sqrt(d / (arr.length - 1));
        let min_value = arr[0] + (sd * dropoff_sds);
        let pos = 0;
        for (let n of arr) {
            if (n > min_value) {
                break;
            }
            pos++;
        }
        return arr.slice(0, pos + 1);
    }
    static percentile(arr, p, sort) {
        if (arr.length === 0) {
            return 0;
        }
        if (sort) {
            arr.sort(function (a, b) { return a - b; });
        }
        if (p <= 0) {
            return arr[0];
        }
        if (p >= 1) {
            return arr[arr.length - 1];
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
        this.canceled = false;
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
    cancel() {
        this.finished = true;
        this.canceled = true;
        this.step = "Canceled";
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
        this.partialData = this.partialData.concat(data);
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
