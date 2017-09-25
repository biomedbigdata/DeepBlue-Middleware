import { EpigeneticMark, Name } from './deepblue';
import { ICloneable } from '../domain/interfaces'
import { IKey } from '../domain/interfaces';
import { IdName } from '../domain/deepblue';

export class DeepBlueParameters implements IKey {
    constructor(public genome: string, public type: string, public epigenetic_mark: string,
        public biosource: string, public sample: string, public technique: string, public project: string) { }

    key(): string {
        let key = "";
        if (this.genome) key += this.genome;
        if (this.type) key += this.type;
        if (this.epigenetic_mark) key += this.epigenetic_mark;
        if (this.biosource) key += this.biosource;
        if (this.sample) key += this.sample;
        if (this.technique) key += this.technique;
        if (this.project) key += this.project;
        return key;
    }

    clone(): DeepBlueParameters {
        return new DeepBlueParameters(this.genome, this.type,
            this.epigenetic_mark, this.biosource, this.sample,
            this.technique, this.project);
    }

    asKeyValue(): Object {
        const params: Object = new Object();

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

export interface DeepBlueOperation extends IKey {
    queryId(): string;

    data(): Name | DeepBlueOperation | DeepBlueParameters;

    getDataName(): string;

    getDataQuery(): string;

    getFilterName(): string;

    getFilterQuery(): string;
}

export class DeepBlueSimpleQuery implements DeepBlueOperation {
    constructor(public _query_id: string) { }

    queryId(): string {
        return this._query_id;
    }

    key(): string {
        return this._query_id;
    }

    clone(): DeepBlueSimpleQuery {
        return new DeepBlueSimpleQuery(
            this._query_id
        );
    }

    data(): Name | DeepBlueOperation | DeepBlueParameters {
        return new Name("");
    }

    getDataName(): string {
        return "";
    }

    getDataQuery(): string {
        return "";
    }

    getFilterName(): string {
        return "";
    }

    getFilterQuery(): string {
        return "";
    }
}

export class DeepBlueSelectData implements DeepBlueOperation {
    constructor(private _data: Name | DeepBlueOperation | DeepBlueParameters,
        public query_id: string, public command: string) { }

    clone(): DeepBlueSelectData {
        return new DeepBlueSelectData(
            this._data.clone(),
            this.query_id,
            this.command
        );
    }

    queryId(): string {
        return this.query_id;
    }

    data(): Name | DeepBlueOperation | DeepBlueParameters {
        return this._data;
    }

    key(): string {
        return this.query_id;
    }

    getDataName(): string {
        if (this._data instanceof Name) {
            return this._data.name;
        }
        return this._data.key();
    }

    getDataQuery(): string {
        return this.query_id;
    }

    getFilterName(): string {
        return "";
    }

    getFilterQuery(): string {
        return "";
    }
}

export class DeepBlueIntersection implements DeepBlueOperation {
    constructor(private _data: DeepBlueOperation, public _filter: DeepBlueOperation, public query_id: string) { }

    clone(): DeepBlueIntersection {
        return new DeepBlueIntersection(
            this._data.clone(),
            this._filter.clone(),
            this.query_id
        );
    }

    queryId(): string {
        return this.query_id;
    }

    data(): Name | DeepBlueOperation | DeepBlueParameters {
        return this._data;
    }

    key(): string {
        return "intersect_" + this._data.queryId() + '_' + this._filter.queryId();
    }

    getDataName(): string {
        return this._data.getDataName();
    }

    getDataQuery(): string {
        return this._data.getDataQuery();
    }

    getFilterName(): string {
        return this._filter.getDataName();
    }

    getFilterQuery(): string {
        return this._filter.getDataQuery();
    }
}

export class DeepBlueFilter implements DeepBlueOperation {
    constructor(private _data: DeepBlueOperation, public _params: FilterParameter, public query_id: string) { }

    queryId(): string {
        return this.query_id;
    };

    data(): Name | DeepBlueOperation | DeepBlueParameters {
        return this._data
    }

    getDataName(): string {
        return this._data.getDataName();
    }

    getDataQuery(): string {
        return this._data.getDataName();
    }

    getFilterName(): string {
        return "filter_regions";
    }

    getFilterQuery(): string {
        return this._params.toString();
    }

    key(): string {
        return "filter_" + this.queryId();
    }

    clone(): DeepBlueFilter {
        return new DeepBlueFilter(
            this._data.clone(),
            this._params.clone(),
            this.query_id
        );
    }

}

export class DeepBlueRequest implements IKey {
    constructor(private _data: DeepBlueOperation, public request_id: string, public command: string) { }

    clone(): DeepBlueRequest {
        return new DeepBlueRequest(
            this._data.clone(),
            this.request_id,
            this.command
        );
    }

    key(): string {
        return this.request_id;
    }

    data(): DeepBlueOperation {
        return this._data;
    }

    getDataName(): string {
        return this._data.getDataName();
    }

    getDataQuery(): string {
        return this._data.getDataQuery();
    }

    getFilterName(): string {
        return this._data.getFilterName();
    }

    getFilterQuery(): string {
        return this._data.getFilterQuery();
    }
}

export class DeepBlueResult implements ICloneable {
    constructor(private _data: DeepBlueRequest, public result: Object) {
    }

    clone(): DeepBlueResult {
        return new DeepBlueResult(
            this._data.clone(),
            this.result
        );
    }

    resultAsString(): string {
        return <string>this.result;
    }

    resultAsCount(): number {
        return <number>this.result["count"];
    }

    resultAsTuples(): Object[] {
        return <Object[]>this.result;
    }

    data(): DeepBlueRequest {
        return this._data;
    }

    getDataName(): string {
        return this._data.getDataName();
    }

    getDataQuery(): string {
        return this._data.getDataQuery();
    }


    getFilterName(): string {
        return this._data.getFilterName();
    }

    getFilterQuery(): string {
        return this._data.getFilterQuery();
    }
}

export class DeepBlueMiddlewareOverlapResult {
    constructor(public data_name: string, public data_query: string,
        public filter_name: string, public filter_query: string,
        public count: number) {
    }

    getDataName(): string {
        return this.data_name;
    }

    getDataQuery(): string {
        return this.data_query;
    }

    getFilterName(): string {
        return this.filter_name;
    }

    getFilterQuery(): string {
        return this.filter_query;
    }

    getCount(): number {
        return this.count;
    }
}

export class DeepBlueMiddlewareGOEnrichtmentResult {
    constructor(public data_name: string, public gene_model: string,
        public results: Object[]) { }

    getDataName(): string {
        return this.data_name;
    }

    getGeneModel(): string {
        return this.gene_model;
    }

    getResults(): Object[] {
        return this.results;
    }
}


export class DeepBlueMiddlewareOverlapEnrichtmentResult {
    constructor(public data_name: string, public universe_id: string, public datasets: Object, public results: Object[]) { }

    getDataName(): string {
        return this.data_name;
    }

    getUniverseId(): string {
        return this.universe_id;
    }

    getDatasets(): Object {
        return this.datasets;
    }

    getResults(): Object[] {
        return this.results;
    }
}

export class FilterParameter {
    constructor(public field: string, public operation: string, public value: string, public type: string) { }

    static fromObject(o: Object): FilterParameter {
        return new FilterParameter(o['field'], o['operation'], o['value'], o['type']);
    }
    asKeyValue(): Object {
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

    clone(): FilterParameter {
        return new FilterParameter(this.field, this.operation, this.value, this.type);
    }

}

