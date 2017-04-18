"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DeepBlueOperation {
    constructor(data, query_id, command, cached = false) {
        this.data = data;
        this.query_id = query_id;
        this.command = command;
        this.cached = cached;
    }
    clone() {
        return new DeepBlueOperation(this.data, this.query_id, this.command, this.cached);
    }
    cacheIt(query_id) {
        return new DeepBlueOperation(this.data, query_id, this.command, true);
    }
    key() {
        return this.query_id;
    }
}
exports.DeepBlueOperation = DeepBlueOperation;
class DeepBlueParametersOperation {
    constructor(operation, parameters, command, cached = false) {
        this.operation = operation;
        this.parameters = parameters;
        this.command = command;
        this.cached = cached;
    }
    clone() {
        return new DeepBlueParametersOperation(this.operation, this.parameters, this.command, this.cached);
    }
    cacheIt(query_id) {
        return new DeepBlueParametersOperation(this.operation, this.parameters, this.command, true);
    }
    key() {
        return this.operation.key() + this.parameters.join();
    }
}
exports.DeepBlueParametersOperation = DeepBlueParametersOperation;
class DeepBlueMultiParametersOperation {
    constructor(op_one, op_two, parameters, command, cached = false) {
        this.op_one = op_one;
        this.op_two = op_two;
        this.parameters = parameters;
        this.command = command;
        this.cached = cached;
    }
    clone() {
        return new DeepBlueMultiParametersOperation(this.op_one, this.op_two, this.parameters, this.command, this.cached);
    }
    cacheIt(query_id) {
        return new DeepBlueMultiParametersOperation(this.op_one, this.op_two, this.parameters, this.command, true);
    }
    key() {
        return this.op_one.key() + this.op_two.key() + this.parameters.join();
    }
}
exports.DeepBlueMultiParametersOperation = DeepBlueMultiParametersOperation;
class DeepBlueRequest {
    constructor(data, request_id, command, operation) {
        this.data = data;
        this.request_id = request_id;
        this.command = command;
        this.operation = operation;
    }
    clone() {
        return new DeepBlueRequest(this.data, this.request_id, this.command, this.operation);
    }
    key() {
        return this.request_id;
    }
}
exports.DeepBlueRequest = DeepBlueRequest;
class DeepBlueResult {
    constructor(data, result, request) {
        this.data = data;
        this.result = result;
        this.request = request;
    }
    clone() {
        return new DeepBlueResult(this.data, this.result, this.request);
    }
    resultAsString() {
        return this.result;
    }
    resultAsCount() {
        return this.result["count"];
    }
}
exports.DeepBlueResult = DeepBlueResult;
class StackValue {
    constructor(stack, value) {
        this.stack = stack;
        this.value = value;
    }
    getDeepBlueOperation() {
        return this.value;
    }
    getDeepBlueParametersOperation() {
        return this.value;
    }
    getDeepBlueMultiParametersOperation() {
        return this.value;
    }
    getDeepBlueRequest() {
        return this.value;
    }
    getDeepBlueResult() {
        return this.value;
    }
}
exports.StackValue = StackValue;
