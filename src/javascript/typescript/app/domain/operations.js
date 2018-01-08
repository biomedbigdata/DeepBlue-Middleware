"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deepblue_1 = require("./deepblue");
const deepblue_2 = require("../domain/deepblue");
const querystring_1 = require("querystring");
function clone(obj) {
    let copy;
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
var DeepBlueResultStatus;
(function (DeepBlueResultStatus) {
    DeepBlueResultStatus["Error"] = "error";
    DeepBlueResultStatus["Okay"] = "okay";
})(DeepBlueResultStatus = exports.DeepBlueResultStatus || (exports.DeepBlueResultStatus = {}));
class DeepBlueCommandExecutionResult {
    constructor(status, result) {
        this.status = status;
        this.result = result;
    }
}
exports.DeepBlueCommandExecutionResult = DeepBlueCommandExecutionResult;
class DeepBlueDataParameter {
    constructor(_data) {
        this._data = _data;
    }
    name() {
        if (this._data instanceof deepblue_1.Name) {
            return this._data.name;
        }
        else if ('string' === typeof this._data) {
            return this._data;
        }
        else {
            return this._data.join(",");
        }
    }
    id() {
        if (this._data instanceof deepblue_2.IdName) {
            return this._data.id;
        }
        if (this._data instanceof deepblue_1.Name) {
            return new deepblue_2.Id(this._data.name);
        }
        else if (this._data instanceof String) {
            return new deepblue_2.Id(this._data);
        }
        else {
            return new deepblue_2.Id(this._data.join(","));
        }
    }
    key() {
        return this.id().id + "_" + this.name();
    }
    clone(request_count) {
        return new DeepBlueDataParameter(this._data);
    }
    text() {
        return querystring_1.stringify(this._data);
    }
}
exports.DeepBlueDataParameter = DeepBlueDataParameter;
class DeepBlueOperationArgs {
    constructor(args) {
        this.args = args;
    }
    key() {
        return textify(this.args);
    }
    clone() {
        return new DeepBlueOperationArgs(clone(this.args));
    }
    asKeyValue() {
        return this.args;
    }
    text() {
        return textify(this.args);
    }
    name() {
        throw new Error("Method not implemented.");
    }
    id() {
        throw new Error("Method not implemented.");
    }
}
exports.DeepBlueOperationArgs = DeepBlueOperationArgs;
class DeepBlueMetadataParameters {
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
        return new DeepBlueMetadataParameters(this.genome, this.type, this.epigenetic_mark, this.biosource, this.sample, this.technique, this.project);
    }
    asKeyValue() {
        const params = {};
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
    text() {
        return textify(this.asKeyValue());
    }
    name() {
        return "Metadata Parameters: " + textify(this.asKeyValue());
    }
    id() {
        return new deepblue_2.Id(textify(this.asKeyValue()));
    }
}
exports.DeepBlueMetadataParameters = DeepBlueMetadataParameters;
class DeepBlueOperation {
    constructor(_data, query_id, command, request_count, cached = false) {
        this._data = _data;
        this.query_id = query_id;
        this.command = command;
        this.request_count = request_count;
        this.cached = cached;
    }
    data() {
        return this._data;
    }
    clone(request_count = -1) {
        return new DeepBlueOperation(this._data, this.query_id, this.command, request_count, this.cached);
    }
    cacheIt(query_id) {
        return new DeepBlueOperation(this._data, query_id, this.command, this.request_count, true);
    }
    key() {
        return this.query_id.id;
    }
    text() {
        return this.command + " " + this._data.name();
    }
    queryId() {
        return this.query_id;
    }
}
exports.DeepBlueOperation = DeepBlueOperation;
class DeepBlueTiling {
    constructor(size, genome, chromosomes, query_id, request_count, cached = false) {
        this.size = size;
        this.genome = genome;
        this.chromosomes = chromosomes;
        this.query_id = query_id;
        this.request_count = request_count;
        this.cached = cached;
    }
    data() {
        return new DeepBlueDataParameter(new deepblue_2.IdName(this.query_id, "Tiling Regions of " + this.size.toLocaleString() + "bp"));
    }
    clone(request_count = -1) {
        return new DeepBlueTiling(this.size, this.genome, this.chromosomes, this.query_id, this.request_count, this.cached);
    }
    cacheIt(query_id) {
        return new DeepBlueTiling(this.size, this.genome, this.chromosomes, this.query_id, this.request_count, true);
    }
    key() {
        return this.query_id.id;
    }
    text() {
        return "Tiling regions of " + this.size;
    }
    queryId() {
        return this.query_id;
    }
}
exports.DeepBlueTiling = DeepBlueTiling;
class DeepBlueIntersection extends DeepBlueOperation {
    constructor(_subject, _filter, query_id, cached = false) {
        super(_subject.data(), query_id, "intersection");
        this._subject = _subject;
        this._filter = _filter;
        this.query_id = query_id;
        this.cached = cached;
    }
    clone() {
        return new DeepBlueIntersection(this._subject.clone(), this._filter.clone(), this.query_id, this.cached);
    }
    queryId() {
        return this.query_id;
    }
    data() {
        return this._subject.data();
    }
    key() {
        return "intersect_" + this._subject.queryId().id + '_' + this._filter.queryId().id;
    }
    getDataName() {
        return this._subject.data.name;
    }
    getDataId() {
        return this._subject.data().id();
    }
    getFilterName() {
        return this._filter.data().name();
    }
    getFilterQuery() {
        return this._filter.queryId();
    }
    cacheIt(query_id) {
        return new DeepBlueIntersection(this._subject, this._filter, this.query_id, true);
    }
    text() {
        return this._subject.text() + " filtered by " + this._filter.text();
    }
}
exports.DeepBlueIntersection = DeepBlueIntersection;
class DeepBlueFilter extends DeepBlueOperation {
    constructor(_subject, _params, query_id, cached = false) {
        super(_subject.data(), query_id, "regions_filter");
        this._subject = _subject;
        this._params = _params;
        this.query_id = query_id;
        this.cached = cached;
    }
    queryId() {
        return this.query_id;
    }
    ;
    data() {
        return this._subject.data();
    }
    getDataName() {
        return this._subject.data().name();
    }
    getDataId() {
        return this._subject.data().id();
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
        return new DeepBlueFilter(this._subject.clone(), this._params.clone(), this.query_id, this.cached);
    }
    cacheIt(query_id) {
        return new DeepBlueFilter(this._subject, this._params, this.query_id, this.cached);
    }
    text() {
        return this._subject.text() + "(" + this._params.text() + ")";
    }
}
exports.DeepBlueFilter = DeepBlueFilter;
class DeepBlueRequest {
    constructor(_operation, request_id, command, request_count) {
        this._operation = _operation;
        this.request_id = request_id;
        this.command = command;
        this.request_count = request_count;
    }
    clone() {
        return new DeepBlueRequest(this._operation.clone(), this.request_id, this.command);
    }
    key() {
        return this.request_id.id;
    }
    data() {
        return this._operation;
    }
    getDataName() {
        return this._operation.data().name();
    }
    getDataId() {
        return this._operation.data().id();
    }
    getFilterName() {
        if (this._operation.getFilterName) {
            return this._operation.getFilterName();
        }
        else {
            return null;
        }
    }
    getFilterQuery() {
        if (this._operation.getFilterName) {
            return this._operation.getFilterQuery();
        }
        else {
            return null;
        }
    }
    text() {
        throw this.request_id;
    }
}
exports.DeepBlueRequest = DeepBlueRequest;
class DeepBlueResult {
    constructor(_data, result, request_count) {
        this._data = _data;
        this.result = result;
        this.request_count = request_count;
    }
    clone() {
        return new DeepBlueResult(this._data.clone(), this.result, this.request_count);
    }
    resultAsString() {
        return this.result;
    }
    static hasResult(result, key) {
        return result[key] !== undefined;
    }
    resultAsCount() {
        if (DeepBlueResult.hasResult(this.result, 'count')) {
            return this.result.count;
        }
        else {
            return null;
        }
    }
    resultAsDistinct() {
        if (DeepBlueResult.hasResult(this.result, 'distinct')) {
            return this.result.distinct;
        }
        else {
            return null;
        }
    }
    resultAsTuples() {
        return this.result;
    }
    resultAsEnrichment() {
        if (DeepBlueResult.hasResult(this.result, 'enrichment')) {
            return this.result.enrichment["results"];
        }
        return [];
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
class DeepBlueError extends DeepBlueResult {
    constructor(request, error) {
        super(request, error);
        this.request = request;
        this.error = error;
    }
    getError() {
        return this.error;
    }
}
exports.DeepBlueError = DeepBlueError;
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
    text() {
        return JSON.stringify(this.asKeyValue());
    }
    clone() {
        return new FilterParameter(this.field, this.operation, this.value, this.type);
    }
}
exports.FilterParameter = FilterParameter;
