"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RequestStatus {
    constructor(request_id) {
        this.total_to_load = 0;
        this.total_loaded = 0;
        this.finished = false;
        this.data = new Array();
        this.request_id = request_id;
    }
    reset(total) {
        this.total_to_load = total;
        this.total_loaded = 0;
        this.step = "";
        this.data = new Array();
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
    setData(data) {
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
