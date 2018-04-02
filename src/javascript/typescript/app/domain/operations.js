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
class AbstractNamedDataType {
    constructor(_data_type) {
        this._data_type = _data_type;
    }
    dataType() {
        return this._data_type;
    }
}
exports.AbstractNamedDataType = AbstractNamedDataType;
class AbstractDataParameter extends AbstractNamedDataType {
    constructor(_data_type) {
        super(_data_type);
        this._data_type = _data_type;
    }
    dataType() {
        return this._data_type;
    }
}
exports.AbstractDataParameter = AbstractDataParameter;
class AbstractFilterParameter extends AbstractDataParameter {
}
exports.AbstractFilterParameter = AbstractFilterParameter;
class DeepBlueEmptyParameter extends AbstractDataParameter {
    constructor() {
        super("empty_parameter");
    }
    name() {
        return "";
    }
    id() {
        return null;
    }
    key() {
        return "";
    }
    clone(request_count) {
        return this;
    }
    text() {
        return "";
    }
}
exports.DeepBlueEmptyParameter = DeepBlueEmptyParameter;
class DeepBlueDataParameter extends AbstractDataParameter {
    constructor(_data) {
        super("data_parameter");
        this._data = _data;
    }
    name() {
        if (this._data instanceof deepblue_1.Name) {
            return this._data.name;
        }
        else if (typeof this._data === 'string') {
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
        else if (typeof this._data === 'string') {
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
class DeepBlueOperationArgs extends AbstractDataParameter {
    constructor(args) {
        super("operation_args");
        this.args = args;
    }
    static fromObject(o) {
        return new DeepBlueOperationArgs(o);
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
        return this.text();
    }
    id() {
        return new deepblue_2.Id(this.text());
    }
}
exports.DeepBlueOperationArgs = DeepBlueOperationArgs;
class DeepBlueMetadataParameters extends AbstractDataParameter {
    constructor(genome, type, epigenetic_mark, biosource, sample, technique, project) {
        super("metadata_parameters");
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
class DeepBlueFilterParameters extends AbstractFilterParameter {
    constructor(field, operation, value, type) {
        super("filter_parameters");
        this.field = field;
        this.operation = operation;
        this.value = value;
        this.type = type;
    }
    static fromObject(o) {
        return new DeepBlueFilterParameters(o.field, o.operation, o.value, o.type);
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
        if (this.field.length > 0 && this.field[0] == "@") {
            this.field = this.field.replace("@", "");
        }
        return this.field + " " + this.operation + " " + this.value;
    }
    clone() {
        return new DeepBlueFilterParameters(this.field, this.operation, this.value, this.type);
    }
    name() {
        return "Filter Parameters: " + textify(this.asKeyValue);
    }
    id() {
        return new deepblue_2.Id(textify(this.asKeyValue));
    }
    key() {
        return this.id().id;
    }
}
exports.DeepBlueFilterParameters = DeepBlueFilterParameters;
class DeepBlueFilterMotifParameters extends AbstractFilterParameter {
    constructor(motif) {
        super("filter_motif_parameter");
        this.motif = motif;
    }
    static fromObject(o) {
        return new DeepBlueFilterMotifParameters(o.motif);
    }
    asKeyValue() {
        let params = {};
        params["motif"] = this.motif;
        return params;
    }
    text() {
        return this.motif;
    }
    clone() {
        return new DeepBlueFilterMotifParameters(this.motif);
    }
    name() {
        return "Filter Motif: " + this.motif;
    }
    id() {
        return new deepblue_2.Id(textify(this.asKeyValue));
    }
    key() {
        return this.id().id;
    }
}
exports.DeepBlueFilterMotifParameters = DeepBlueFilterMotifParameters;
class DeepBlueOperation extends AbstractNamedDataType {
    constructor(_data, query_id, command, request_count, cached = false) {
        super("data_operation");
        this._data = _data;
        this.query_id = query_id;
        this.command = command;
        this.request_count = request_count;
        this.cached = cached;
    }
    data() {
        return this._data;
    }
    mainOperation() {
        if (this._data instanceof DeepBlueOperation) {
            return this._data.mainOperation();
        }
        return this;
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
    name() {
        return this._data.name();
    }
    id() {
        return this.query_id;
    }
}
exports.DeepBlueOperation = DeepBlueOperation;
class DeepBlueTiling extends AbstractNamedDataType {
    constructor(size, genome, chromosomes, query_id, request_count, cached = false) {
        super("tiling");
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
    mainOperation() {
        return this;
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
    name() {
        return this.text();
    }
    id() {
        return this.query_id;
    }
}
exports.DeepBlueTiling = DeepBlueTiling;
class DeepBlueIntersection extends DeepBlueOperation {
    constructor(_subject, _filter, overlap, query_id, cached = false) {
        super(_subject.data(), query_id, "intersection");
        this._subject = _subject;
        this._filter = _filter;
        this.overlap = overlap;
        this.query_id = query_id;
        this.cached = cached;
    }
    clone() {
        return new DeepBlueIntersection(this._subject.clone(), this._filter.clone(), this.overlap, this.query_id, this.cached);
    }
    data() {
        return this._subject;
    }
    key() {
        return "intersect_" + this._subject.id().id + '_' + this._filter.id().id;
    }
    mainOperation() {
        return this._subject.mainOperation();
    }
    filter() {
        return this._filter;
    }
    cacheIt(query_id) {
        return new DeepBlueIntersection(this._subject, this._filter, this.overlap, this.query_id, true);
    }
    text() {
        if (this.overlap) {
            return "Overlapping " + this._filter.text();
        }
        else {
            return "Not overlapping " + this._filter.text();
        }
    }
}
exports.DeepBlueIntersection = DeepBlueIntersection;
class DeepBlueAggregate extends DeepBlueOperation {
    constructor(_subject, _ranges, field, query_id, cached = false) {
        super(_subject.data(), query_id, "aggregate");
        this._subject = _subject;
        this._ranges = _ranges;
        this.field = field;
        this.query_id = query_id;
        this.cached = cached;
    }
    clone() {
        return new DeepBlueAggregate(this._subject.clone(), this._ranges.clone(), this.field, this.query_id, this.cached);
    }
    data() {
        return this._subject;
    }
    key() {
        return "aggreate_" + this._subject.id().id + '_' + this._ranges.id().id;
    }
    mainOperation() {
        return this._subject.mainOperation();
    }
    filter() {
        return this._ranges;
    }
    cacheIt(query_id) {
        return new DeepBlueAggregate(this._subject, this._ranges, this.field, this.query_id, true);
    }
    text() {
        return this._subject.text() + " aggregated by " + this._ranges.text();
    }
}
exports.DeepBlueAggregate = DeepBlueAggregate;
class DeepBlueFilter extends DeepBlueOperation {
    constructor(_data, _params, query_id, cached = false) {
        super(_data, query_id, "regions_filter");
        this._data = _data;
        this._params = _params;
        this.query_id = query_id;
        this.cached = cached;
    }
    data() {
        return this._data;
    }
    mainOperation() {
        return this._data.mainOperation();
    }
    filter() {
        return this._params;
    }
    key() {
        return "filter_" + this.id().id;
    }
    clone() {
        return new DeepBlueFilter(this._data.clone(), this._params.clone(), this.query_id, this.cached);
    }
    cacheIt(query_id) {
        return new DeepBlueFilter(this._data, this._params, this.query_id, this.cached);
    }
    text() {
        return this._data.text() + " by " + this._params.text();
    }
}
exports.DeepBlueFilter = DeepBlueFilter;
class DeepBlueFlank extends DeepBlueOperation {
    constructor(_data, _params, query_id, cached = false) {
        super(_data, query_id, "flank");
        this._data = _data;
        this._params = _params;
        this.query_id = query_id;
        this.cached = cached;
    }
    data() {
        return this._data;
    }
    mainOperation() {
        return this._data.mainOperation();
    }
    filter() {
        return this._params;
    }
    key() {
        return "flank_" + this.id().id;
    }
    clone() {
        return new DeepBlueFlank(this._data.clone(), this._params.clone(), this.query_id, this.cached);
    }
    cacheIt(query_id) {
        return new DeepBlueFlank(this._data, this._params, this.query_id, this.cached);
    }
    text() {
        return "flanking at " + this._params.args['start'] + " by " + this._params.args['length'] + "bp";
    }
}
exports.DeepBlueFlank = DeepBlueFlank;
class DeepBlueExtend extends DeepBlueOperation {
    constructor(_data, _params, query_id, cached = false) {
        super(_data, query_id, "extend");
        this._data = _data;
        this._params = _params;
        this.query_id = query_id;
        this.cached = cached;
    }
    data() {
        return this._data;
    }
    mainOperation() {
        return this._data.mainOperation();
    }
    filter() {
        return this._params;
    }
    key() {
        return "extend_" + this.id().id;
    }
    clone() {
        return new DeepBlueExtend(this._data.clone(), this._params.clone(), this.query_id, this.cached);
    }
    cacheIt(query_id) {
        return new DeepBlueExtend(this._data, this._params, this.query_id, this.cached);
    }
    text() {
        return "extend by " + this._params.args['length'] + "bp to " + this._params.args['direction'].toLocaleLowerCase() + " direction(s)";
    }
}
exports.DeepBlueExtend = DeepBlueExtend;
class DeepBlueOperationError extends AbstractNamedDataType {
    constructor(message, request_count) {
        super("error");
        this.message = message;
        this.request_count = request_count;
    }
    data() {
        return new DeepBlueDataParameter(this.message);
    }
    mainOperation() {
        return this;
    }
    cacheIt(query_id) {
        return this;
    }
    name() {
        return this.message;
    }
    id() {
        return new deepblue_2.Id(this.message);
    }
    key() {
        return this.message;
    }
    clone(request_count) {
        return new DeepBlueOperationError(this.message, this.request_count);
    }
    text() {
        return this.message;
    }
}
exports.DeepBlueOperationError = DeepBlueOperationError;
class DeepBlueResult {
    constructor(request, result, request_count) {
        this.request = request;
        this.result = result;
        this.request_count = request_count;
    }
    static fromObject(obj) {
        return new DeepBlueResult(DeepBlueRequest.fromObject(obj['request']), obj['result']);
    }
    clone() {
        return new DeepBlueResult(this.request.clone(), this.result, this.request_count);
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
    getRequestId() {
        return this.request._id;
    }
    getData() {
        return this.request.getData();
    }
    getFilter() {
        return this.request.getFilter();
    }
}
exports.DeepBlueResult = DeepBlueResult;
class DeepBlueResultError extends DeepBlueResult {
    constructor(request, error, request_count) {
        super(request, error, request_count);
        this.request = request;
        this.error = error;
        this.request_count = request_count;
    }
}
exports.DeepBlueResultError = DeepBlueResultError;
class StackValue {
    constructor(stack, value) {
        this.stack = stack;
        this.value = value;
    }
    getDeepBlueOperation() {
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
class DeepBlueError extends DeepBlueResult {
    constructor(request, error, request_count) {
        super(request, error, request_count);
        this.request = request;
        this.error = error;
        this.request_count = request_count;
    }
    getError() {
        return this.error;
    }
}
exports.DeepBlueError = DeepBlueError;
class DeepBlueMiddlewareGOEnrichtmentResult {
    constructor(data_name, gene_model, results) {
        this.data_name = data_name;
        this.gene_model = gene_model;
        this.results = results;
    }
    static fromObject(obj) {
        return new DeepBlueMiddlewareGOEnrichtmentResult(obj['data_name'], obj['gene_model'], obj['results']);
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
    static fromObject(obj) {
        return new DeepBlueMiddlewareOverlapEnrichtmentResult(obj['data_name'], new deepblue_2.Id(obj['universe_id']), obj['datasets'], obj['results']['enrichment']['results'].map((obj) => DeepBlueMiddlewareOverlapEnrichtmentResultItem.fromObject(obj)));
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
class AbstractDeepBlueRequest {
    constructor(_id, command) {
        this._id = _id;
        this.command = command;
        this.canceled = false;
    }
    isCanceled() {
        return this.canceled;
    }
    cancel() {
        this.canceled = true;
    }
    key() {
        return this._id.id;
    }
    clone(request_count) {
        throw new Error("Method not implemented.");
    }
    text() {
        return "Request - " + this.command + "(" + this.id + ")";
    }
    id() {
        return this._id;
    }
}
exports.AbstractDeepBlueRequest = AbstractDeepBlueRequest;
class DeepBlueRequest extends AbstractDeepBlueRequest {
    constructor(_operation, _id, command, request_count) {
        super(_id, command);
        this._operation = _operation;
        this._id = _id;
        this.command = command;
        this.request_count = request_count;
    }
    static fromObject(obj) {
        return new DeepBlueRequest(toClass(obj['_operation']), new deepblue_2.Id(obj['_id']), obj['command']);
    }
    clone(request_count) {
        return new DeepBlueRequest(this._operation.clone(), this._id, this.command, request_count);
    }
    key() {
        return this._id.id;
    }
    data() {
        return this._operation;
    }
    getData() {
        return this._operation.data();
    }
    getFilter() {
        if (this._operation.filter) {
            return this._operation.filter();
        }
        else {
            return null;
        }
    }
    text() {
        return "Request: " + this._id.id;
    }
    id() {
        return this._id;
    }
}
exports.DeepBlueRequest = DeepBlueRequest;
class DeepBlueMiddlewareRequest extends AbstractDeepBlueRequest {
    constructor(parameters, command, _id) {
        super(_id, command);
        this.parameters = parameters;
        this.command = command;
        this._id = _id;
    }
    clone(request_count) {
        return new DeepBlueMiddlewareRequest(this.parameters, this.command, this._id);
    }
    requestId() {
        return this._id;
    }
    key() {
        return this._id.id;
    }
    text() {
        return "MiddlewareRequest: " + this._id.id;
    }
}
exports.DeepBlueMiddlewareRequest = DeepBlueMiddlewareRequest;
class DeepBlueMiddlewareOverlapEnrichtmentResultItem {
    constructor(dataset, biosource, epigenetic_mark, description, experiment_size, database_name, p_value_log, odds_ratio, support, b, c, d, support_rank, log_rank, odd_rank, max_rank, mean_rank, data) {
        this.dataset = dataset;
        this.biosource = biosource;
        this.epigenetic_mark = epigenetic_mark;
        this.description = description;
        this.experiment_size = experiment_size;
        this.database_name = database_name;
        this.p_value_log = p_value_log;
        this.odds_ratio = odds_ratio;
        this.support = support;
        this.b = b;
        this.c = c;
        this.d = d;
        this.support_rank = support_rank;
        this.log_rank = log_rank;
        this.odd_rank = odd_rank;
        this.max_rank = max_rank;
        this.mean_rank = mean_rank;
        this.data = data;
        // JSON does not send infinity values, so we have to fix it manually.
        this.p_value_log = this.p_value_log != null ? this.p_value_log : Infinity;
        this.odds_ratio = this.odds_ratio != null ? this.odds_ratio : Infinity;
    }
    static fromObject(obj) {
        return new DeepBlueMiddlewareOverlapEnrichtmentResultItem(obj['dataset'], obj['biosource'], obj['epigenetic_mark'], obj['description'], obj['experiment_size'], obj['database_name'], obj['p_value_log'], obj['odds_ratio'], obj['support'], obj['b'], obj['c'], obj['d'], obj['support_rank'], obj['log_rank'], obj['odd_rank'], obj['max_rank'], obj['mean_rank'], obj);
    }
    static asColumns() {
        return [
            { name: 'dataset', prop: 'dataset', column_type: 'string' },
            { name: 'biosource', prop: 'biosource', column_type: 'string' },
            { name: 'epigenetic_mark', prop: 'epigeneticmark', column_type: 'string' },
            { name: 'description', prop: 'description', column_type: 'string' },
            { name: 'experiment_size', prop: 'experimentsize', column_type: 'integer' },
            { name: 'database_name', prop: 'databasename', column_type: 'string' },
            { name: 'p_value_log', prop: 'pvaluelog', column_type: 'double' },
            { name: 'odds_ratio', prop: 'oddsratio', column_type: 'double' },
            { name: 'support', prop: 'support', column_type: 'integer' },
            { name: 'b', prop: 'b', column_type: 'integer' },
            { name: 'c', prop: 'c', column_type: 'integer' },
            { name: 'd', prop: 'd', column_type: 'integer' },
            { name: 'support_rank', prop: 'supportrank', column_type: 'integer' },
            { name: 'log_rank', prop: 'logrank', column_type: 'integer' },
            { name: 'odd_rank', prop: 'oddrank', column_type: 'integer' },
            { name: 'max_rank', prop: 'maxrank', column_type: 'integer' },
            { name: 'mean_rank', prop: 'meanrank', column_type: 'integer' }
        ];
    }
}
exports.DeepBlueMiddlewareOverlapEnrichtmentResultItem = DeepBlueMiddlewareOverlapEnrichtmentResultItem;
function toClass(o) {
    switch (o._data_type) {
        case 'data_parameter': {
            let data;
            if (o._data.name) {
                data = new deepblue_1.Name(o._data.name);
            }
            else {
                data = o._data;
            }
            return new DeepBlueDataParameter(data);
        }
        case 'operation_args': {
            return new DeepBlueOperationArgs(o.args);
        }
        case 'metadata_parameters': {
            return new DeepBlueMetadataParameters(o.genome, o.type, o.epigenetic_mark, o.biosource, o.sample, o.technique, o.project);
        }
        case 'tiling': {
            return new DeepBlueTiling(o.size, o.genome, o.chromosomes, new deepblue_2.Id(o.query_id.id), o.request_count, o.cached);
        }
        case 'data_operation': {
            switch (o.command) {
                case 'intersection': {
                    let subject = toClass(o._subject);
                    let filter = toClass(o._filter);
                    let overlap = o.overlap;
                    let query_id = new deepblue_2.Id(o.query_id.id);
                    return new DeepBlueIntersection(subject, filter, overlap, query_id, o.cached);
                }
                case 'aggregate': {
                    let subject = toClass(o._subject);
                    let filter = toClass(o._ranges);
                    let field = o.field;
                    let query_id = new deepblue_2.Id(o.query_id.id);
                    return new DeepBlueAggregate(subject, filter, field, query_id, o.cached);
                }
                case 'regions_filter': {
                    let data = toClass(o._data);
                    let filter = DeepBlueFilterParameters.fromObject(o._params);
                    let query_id = new deepblue_2.Id(o.query_id.id);
                    return new DeepBlueFilter(data, filter, query_id, o.cached);
                }
                case 'flank': {
                    let data = toClass(o._data);
                    let params = toClass(o._params);
                    let query_id = new deepblue_2.Id(o.query_id.id);
                    return new DeepBlueFlank(data, params, query_id);
                }
                case 'extend': {
                    let data = toClass(o._data);
                    let params = toClass(o._params);
                    let query_id = new deepblue_2.Id(o.query_id.id);
                    return new DeepBlueExtend(data, params, query_id);
                }
                default: {
                    let data = toClass(o._data);
                    let query_id = new deepblue_2.Id(o.query_id.id);
                    return new DeepBlueOperation(data, query_id, o.command, o.request_count, o.cached);
                }
            }
        }
        default: {
            console.warn("Invalid type: ", o._data_type);
        }
    }
}
exports.toClass = toClass;
