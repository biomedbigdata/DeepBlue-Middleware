"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ProgressElement {
    constructor() {
        this.total_to_load = 0;
        this.total_loaded = 0;
    }
    reset(total) {
        this.total_to_load = total;
        this.total_loaded = 0;
    }
    increment() {
        this.total_loaded++;
        let next_value = Math.ceil(this.total_loaded * 100 / this.total_to_load);
    }
}
exports.ProgressElement = ProgressElement;
