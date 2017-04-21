"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DeepBlueSelectData {
    constructor(_data, query_id, command) {
        this._data = _data;
        this.query_id = query_id;
        this.command = command;
    }
    clone() {
        return new DeepBlueSelectData(this._data, this.query_id, this.command);
    }
    queryId() {
        return this.query_id;
    }
    data() {
        return this._data;
    }
    key() {
        return this.query_id;
    }
    getDataName() {
        return this._data.name;
    }
}
exports.DeepBlueSelectData = DeepBlueSelectData;
class DeepBlueParametersOperation {
    constructor(operation, parameters, command) {
        this.operation = operation;
        this.parameters = parameters;
        this.command = command;
    }
    clone() {
        return new DeepBlueParametersOperation(this.operation, this.parameters, this.command);
    }
    key() {
        return this.operation.key() + this.parameters.join();
    }
}
exports.DeepBlueParametersOperation = DeepBlueParametersOperation;
class DeepBlueIntersection {
    constructor(_data, filter, query_id) {
        this._data = _data;
        this.filter = filter;
        this.query_id = query_id;
    }
    clone() {
        return new DeepBlueIntersection(this._data, this.filter, this.query_id);
    }
    queryId() {
        return this.query_id;
    }
    data() {
        return this._data;
    }
    key() {
        return this._data.queryId() + '_' + this.filter.queryId();
    }
    getDataName() {
        return this._data.getDataName();
    }
}
exports.DeepBlueIntersection = DeepBlueIntersection;
class DeepBlueMultiParametersOperation {
    constructor(op_one, op_two, parameters, command) {
        this.op_one = op_one;
        this.op_two = op_two;
        this.parameters = parameters;
        this.command = command;
    }
    clone() {
        return new DeepBlueMultiParametersOperation(this.op_one, this.op_two, this.parameters, this.command);
    }
    key() {
        return this.op_one.key() + this.op_two.key() + this.parameters.join();
    }
}
exports.DeepBlueMultiParametersOperation = DeepBlueMultiParametersOperation;
class DeepBlueRequest {
    constructor(_data, request_id, command, operation) {
        this._data = _data;
        this.request_id = request_id;
        this.command = command;
        this.operation = operation;
    }
    clone() {
        return new DeepBlueRequest(this._data, this.request_id, this.command, this.operation);
    }
    key() {
        return this.request_id;
    }
    data() {
        return this._data;
    }
    getDataName() {
        return this._data.getDataName();
    }
}
exports.DeepBlueRequest = DeepBlueRequest;
class DeepBlueResult {
    constructor(_data, result, request) {
        this._data = _data;
        this.result = result;
        this.request = request;
    }
    clone() {
        return new DeepBlueResult(this._data, this.result, this.request);
    }
    resultAsString() {
        return this.result;
    }
    resultAsCount() {
        return this.result["count"];
    }
    data() {
        return this._data;
    }
    getDataName() {
        return this._data.getDataName();
    }
}
exports.DeepBlueResult = DeepBlueResult;
