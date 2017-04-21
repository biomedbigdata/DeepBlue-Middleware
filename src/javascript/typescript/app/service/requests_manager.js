"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RequestManager {
    constructor(request_count = 0) {
        this.request_count = request_count;
        this.requests = new Map();
    }
    startRequest() {
        let request_id = this.request_count++;
        this.requests[request_id.toLocaleString()] = "new";
        return request_id.toLocaleString();
    }
    getRequest(request_id) {
        return this.requests[request_id];
    }
    storeRequest(request_id, data) {
        this.requests[request_id] = data;
    }
}
exports.RequestManager = RequestManager;
