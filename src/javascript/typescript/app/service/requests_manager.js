"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const status_1 = require("../domain/status");
class RequestManager {
    constructor(request_count = 0) {
        this.request_count = request_count;
        this.requests = new Map();
    }
    startRequest() {
        let request_id = "mw" + this.request_count++;
        let request_status = new status_1.RequestStatus(request_id);
        this.requests[request_id] = request_status;
        return request_status;
    }
    getRequest(request_id) {
        return this.requests[request_id];
    }
    cancelRequest(request_id) {
        let status = this.requests[request_id];
        status.cancel();
    }
}
exports.RequestManager = RequestManager;
