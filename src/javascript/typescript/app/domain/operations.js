"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deepblue_1 = require("./deepblue");
const deepblue_2 = require("../domain/deepblue");
function clone(obj) {
    var copy;
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj)
        return obj;
    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }
    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }
    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) {
                copy[attr] = clone(obj[attr]);
            }
        }
        return copy;
    }
    throw new Error("Unable to copy obj! Its type isn't supported.");
}
function textify(obj) {
    if ("string" == typeof obj) {
        return obj;
    }
    if ("number" == typeof obj) {
        return obj.toString();
    }
    // Handle Date
    if (obj instanceof Date) {
        return obj.toDateString();
    }
    // Handle Array
    if (obj instanceof Array) {
        let text = "";
        for (var i = 0, len = obj.length; i < len; i++) {
            text += textify(obj[i]);
        }
        return text;
    }
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) {
        return "";
    }
    // Handle Object
    if (obj instanceof Object) {
        let text = "";
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) {
                text += textify(obj[attr]);
            }
        }
        return text;
    }
    throw new Error("Unable to textify " + obj + "! Its type isn't supported.");
}
class DeepBlueArgs {
    constructor(args) {
        this.args = args;
    }
    key() {
        return textify(this.args);
    }
    clone() {
        return new DeepBlueArgs(clone(this.args));
    }
    asKeyValue() {
        return this.args;
    }
}
exports.DeepBlueArgs = DeepBlueArgs;
class DeepBlueParameters {
    constructor(genome, type, epigenetic_mark, biosource, sample, technique, project) {
        this.genome = genome;
        this.type = type;
        this.epigenetic_mark = epigenetic_mark;
        this.biosource = biosource;
        this.sample = sample;
        this.technique = technique;
        this.project = project;
    }
    key() {
        let key = "";
        if (this.genome)
            key += this.genome;
        if (this.type)
            key += this.type;
        if (this.epigenetic_mark)
            key += this.epigenetic_mark;
        if (this.biosource)
            key += this.biosource;
        if (this.sample)
            key += this.sample;
        if (this.technique)
            key += this.technique;
        if (this.project)
            key += this.project;
        return key;
    }
    clone() {
        return new DeepBlueParameters(this.genome, this.type, this.epigenetic_mark, this.biosource, this.sample, this.technique, this.project);
    }
    asKeyValue() {
        const params = new Object();
        if (this.genome) {
            params['genome'] = this.genome;
        }
        if (this.type) {
            params['type'] = this.type;
        }
        if (this.epigenetic_mark) {
            params['epigenetic_mark'] = this.epigenetic_mark;
        }
        if (this.biosource) {
            params['biosource'] = this.biosource;
        }
        if (this.sample) {
            params['sample'] = this.sample;
        }
        if (this.technique) {
            params['technique'] = this.technique;
        }
        if (this.project) {
            params['project'] = this.project;
        }
        return params;
    }
}
exports.DeepBlueParameters = DeepBlueParameters;
class DeepBlueSimpleQuery {
    constructor(_query_id, cached = false) {
        this._query_id = _query_id;
        this.cached = cached;
    }
    queryId() {
        return this._query_id;
    }
    key() {
        return this._query_id.id;
    }
    clone() {
        return new DeepBlueSimpleQuery(this._query_id, this.cached);
    }
    data() {
        return new deepblue_1.Name("");
    }
    getDataName() {
        return "";
    }
    getDataId() {
        return this._query_id;
    }
    getFilterName() {
        return "";
    }
    getFilterQuery() {
        return null;
    }
    cacheIt(query_id) {
        return new DeepBlueSimpleQuery(query_id, true);
    }
}
exports.DeepBlueSimpleQuery = DeepBlueSimpleQuery;
class DeepBlueSelectData {
    constructor(_data, query_id, command, cached = false) {
        this._data = _data;
        this.query_id = query_id;
        this.command = command;
        this.cached = cached;
    }
    clone() {
        return new DeepBlueSelectData(this._data.clone(), this.query_id, this.command, this.cached);
    }
    queryId() {
        return this.query_id;
    }
    data() {
        return this._data;
    }
    key() {
        return this.query_id.id;
    }
    getDataName() {
        if (this._data instanceof deepblue_1.Name) {
            return this._data.name;
        }
        return this._data.key();
    }
    getDataId() {
        if (this._data instanceof deepblue_2.IdName) {
            return this._data.Id();
        }
        if (this._data instanceof deepblue_1.Name) {
            return new deepblue_2.Id("");
        }
        if (this._data instanceof DeepBlueParameters) {
            return new deepblue_2.Id("");
        }
        return this._data.getDataId();
    }
    getFilterName() {
        return "";
    }
    getFilterQuery() {
        return null;
    }
    cacheIt(query_id) {
        return new DeepBlueSelectData(this._data, this.query_id, this.command, true);
    }
}
exports.DeepBlueSelectData = DeepBlueSelectData;
class DeepBlueTilingRegions {
    constructor(size, genome, query_id, cached = false) {
        this.size = size;
        this.genome = genome;
        this.query_id = query_id;
        this.cached = cached;
    }
    queryId() {
        return this.query_id;
    }
    data() {
        return new deepblue_1.Name(this.genome + " " + this.size.toString());
    }
    getDataName() {
        return this.genome + " " + this.size.toString();
    }
    getDataId() {
        return this.query_id;
    }
    getFilterName() {
        return null;
    }
    getFilterQuery() {
        return null;
    }
    key() {
        return this.query_id.id;
    }
    clone() {
        return new DeepBlueTilingRegions(this.size, this.genome, this.query_id, this.cached);
    }
    cacheIt(query_id) {
        return new DeepBlueTilingRegions(this.size, this.genome, this.query_id, true);
    }
}
exports.DeepBlueTilingRegions = DeepBlueTilingRegions;
class DeepBlueIntersection {
    constructor(_data, _filter, query_id, cached = false) {
        this._data = _data;
        this._filter = _filter;
        this.query_id = query_id;
        this.cached = cached;
    }
    clone() {
        return new DeepBlueIntersection(this._data.clone(), this._filter.clone(), this.query_id, this.cached);
    }
    queryId() {
        return this.query_id;
    }
    data() {
        return this._data;
    }
    key() {
        return "intersect_" + this._data.queryId().id + '_' + this._filter.queryId().id;
    }
    getDataName() {
        return this._data.getDataName();
    }
    getDataId() {
        return this._data.getDataId();
    }
    getFilterName() {
        return this._filter.getDataName();
    }
    getFilterQuery() {
        return this._filter.queryId();
    }
    cacheIt(query_id) {
        return new DeepBlueIntersection(this._data, this._filter, this.query_id, true);
    }
}
exports.DeepBlueIntersection = DeepBlueIntersection;
class DeepBlueFilter {
    constructor(_data, _params, query_id, cached = false) {
        this._data = _data;
        this._params = _params;
        this.query_id = query_id;
        this.cached = cached;
    }
    queryId() {
        return this.query_id;
    }
    ;
    data() {
        return this._data;
    }
    getDataName() {
        return this._data.getDataName();
    }
    getDataId() {
        return this._data.getDataId();
    }
    getFilterName() {
        return "filter_regions";
    }
    getFilterQuery() {
        return new deepblue_2.Id(this._params.toString());
    }
    key() {
        return "filter_" + this.queryId().id;
    }
    clone() {
        return new DeepBlueFilter(this._data.clone(), this._params.clone(), this.query_id, this.cached);
    }
    cacheIt(query_id) {
        return new DeepBlueFilter(this._data, this._params, this.query_id, this.cached);
    }
}
exports.DeepBlueFilter = DeepBlueFilter;
class DeepBlueRequest {
    constructor(_data, request_id, command) {
        this._data = _data;
        this.request_id = request_id;
        this.command = command;
    }
    clone() {
        return new DeepBlueRequest(this._data.clone(), this.request_id, this.command);
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
    getDataId() {
        return this._data.getDataId();
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
        return new DeepBlueResult(this._data.clone(), this.result);
    }
    resultAsString() {
        return this.result;
    }
    resultAsCount() {
        return this.result["count"];
    }
    resultAsDistinct() {
        return this.result["distinct"];
    }
    resultAsTuples() {
        return this.result;
    }
    data() {
        return this._data;
    }
    getDataName() {
        return this._data.getDataName();
    }
    getDataId() {
        return this._data.getDataId();
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
class DeepBlueMiddlewareGOEnrichtmentResult {
    constructor(data_name, gene_model, results) {
        this.data_name = data_name;
        this.gene_model = gene_model;
        this.results = results;
    }
    getDataName() {
        return this.data_name;
    }
    getGeneModel() {
        return this.gene_model;
    }
    getResults() {
        return this.results;
    }
}
exports.DeepBlueMiddlewareGOEnrichtmentResult = DeepBlueMiddlewareGOEnrichtmentResult;
class DeepBlueMiddlewareOverlapEnrichtmentResult {
    constructor(data_name, universe_id, datasets, results) {
        this.data_name = data_name;
        this.universe_id = universe_id;
        this.datasets = datasets;
        this.results = results;
    }
    getDataName() {
        return this.data_name;
    }
    getUniverseId() {
        return this.universe_id;
    }
    getDatasets() {
        return this.datasets;
    }
    getResults() {
        return this.results;
    }
}
exports.DeepBlueMiddlewareOverlapEnrichtmentResult = DeepBlueMiddlewareOverlapEnrichtmentResult;
class FilterParameter {
    constructor(field, operation, value, type) {
        this.field = field;
        this.operation = operation;
        this.value = value;
        this.type = type;
    }
    static fromObject(o) {
        return new FilterParameter(o['field'], o['operation'], o['value'], o['type']);
    }
    asKeyValue() {
        let params = {};
        params["field"] = this.field;
        params["operation"] = this.operation;
        params["value"] = this.value;
        params["type"] = this.type;
        return params;
    }
    toString() {
        return JSON.stringify(this.asKeyValue());
    }
    clone() {
        return new FilterParameter(this.field, this.operation, this.value, this.type);
    }
}
exports.FilterParameter = FilterParameter;
