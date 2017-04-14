"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ProgressElement {
    constructor() {
        this.total_to_load = 0;
        this.total_loaded = 0;
        this.request_count = -1;
    }
    reset(total, request_count) {
        this.total_to_load = total;
        this.total_loaded = 0;
        this.request_count = request_count;
    }
    increment(request_count) {
        if (request_count != this.request_count) {
            return;
        }
        this.total_loaded++;
        let next_value = Math.ceil(this.total_loaded * 100 / this.total_to_load);
    }
}
exports.ProgressElement = ProgressElement;
