import { Name } from './deepblue';
import { ICloneable } from 'app/domain/interfaces'
import { IKey } from 'app/domain/interfaces';
import { IdName } from 'app/domain/deepblue';


export interface DeepBlueOperation extends IKey {
    queryId(): string;

    data(): DeepBlueOperation | Name;

    getDataName(): string;

    getDataQuery(): string;

    getFilterName(): string;

    getFilterQuery(): string;
}

export class DeepBlueSelectData implements DeepBlueOperation {
    constructor(private _data: Name, public query_id: string, public command: string) { }

    clone(): DeepBlueSelectData {
        return new DeepBlueSelectData(this._data, this.query_id, this.command);
    }

    queryId(): string {
        return this.query_id;
    }

    data(): DeepBlueOperation | Name {
        return this._data;
    }

    key(): string {
        return this.query_id;
    }

    getDataName(): string {
        return this._data.name;
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
        return new DeepBlueIntersection(this._data, this._filter, this.query_id);
    }

    queryId(): string {
        return this.query_id;
    }

    data(): DeepBlueOperation | Name {
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

export class DeepBlueRequest implements IKey {
    constructor(private _data: DeepBlueOperation, public request_id: string, public command: string) { }

    clone(): DeepBlueRequest {
        return new DeepBlueRequest(this._data, this.request_id, this.command)
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
        return new DeepBlueResult(this._data, this.result);
    }

    resultAsString(): string {
        return <string>this.result;
    }

    resultAsCount(): number {
        return <number>this.result["count"];
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
