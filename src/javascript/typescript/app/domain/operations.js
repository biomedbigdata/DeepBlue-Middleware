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
    getDataQuery() {
        return this.query_id;
    }
    getFilterName() {
        return "";
    }
    getFilterQuery() {
        return "";
    }
}
exports.DeepBlueSelectData = DeepBlueSelectData;
class DeepBlueIntersection {
    constructor(_data, _filter, query_id) {
        this._data = _data;
        this._filter = _filter;
        this.query_id = query_id;
    }
    clone() {
        return new DeepBlueIntersection(this._data, this._filter, this.query_id);
    }
    queryId() {
        return this.query_id;
    }
    data() {
        return this._data;
    }
    key() {
        return "intersect_" + this._data.queryId() + '_' + this._filter.queryId();
    }
    getDataName() {
        return this._data.getDataName();
    }
    getDataQuery() {
        return this._data.getDataQuery();
    }
    getFilterName() {
        return this._filter.getDataName();
    }
    getFilterQuery() {
        return this._filter.getDataQuery();
    }
}
exports.DeepBlueIntersection = DeepBlueIntersection;
class DeepBlueRequest {
    constructor(_data, request_id, command) {
        this._data = _data;
        this.request_id = request_id;
        this.command = command;
    }
    clone() {
        return new DeepBlueRequest(this._data, this.request_id, this.command);
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
    getDataQuery() {
        return this._data.getDataQuery();
    }
    getFilterName() {
        return this._data.getFilterName();
    }
    getFilterQuery() {
        return this._data.getFilterQuery();
    }
}
exports.DeepBlueRequest = DeepBlueRequest;
class DeepBlueResult {
    constructor(_data, result) {
        this._data = _data;
        this.result = result;
    }
    clone() {
        return new DeepBlueResult(this._data, this.result);
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
    getDataQuery() {
        return this._data.getDataQuery();
    }
    getFilterName() {
        return this._data.getFilterName();
    }
    getFilterQuery() {
        return this._data.getFilterQuery();
    }
}
exports.DeepBlueResult = DeepBlueResult;
class DeepBlueMiddlewareOverlapResult {
    constructor(data_name, data_query, filter_name, filter_query, count) {
        this.data_name = data_name;
        this.data_query = data_query;
        this.filter_name = filter_name;
        this.filter_query = filter_query;
        this.count = count;
    }
    getDataName() {
        return this.data_name;
    }
    getDataQuery() {
        return this.data_query;
    }
    getFilterName() {
        return this.filter_name;
    }
    getFilterQuery() {
        return this.filter_query;
    }
    getCount() {
        return this.count;
    }
}
exports.DeepBlueMiddlewareOverlapResult = DeepBlueMiddlewareOverlapResult;
