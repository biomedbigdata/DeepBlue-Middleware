import { Name } from './deepblue';
import { ICloneable } from 'app/domain/interfaces'
import { IKey } from 'app/domain/interfaces';
import { IdName } from 'app/domain/deepblue';


export interface DeepBlueOperation extends IKey {
    queryId(): string;

    data(): DeepBlueOperation | Name;

    getDataName() : string;
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

    getDataName() : string {
        return this._data.name;
    }
}

export class DeepBlueParametersOperation implements IKey {
    constructor(public operation: DeepBlueOperation, public parameters: string[], public command: string) { }

    clone(): DeepBlueParametersOperation {
        return new DeepBlueParametersOperation(this.operation, this.parameters, this.command);
    }

    key(): string {
        return this.operation.key() + this.parameters.join();
    }
}

export class DeepBlueIntersection implements DeepBlueOperation {
    constructor(private _data: DeepBlueOperation, public filter: DeepBlueOperation, public query_id: string) { }

    clone(): DeepBlueIntersection {
        return new DeepBlueIntersection(this._data, this.filter, this.query_id);
    }

    queryId(): string {
        return this.query_id;
    }

    data(): DeepBlueOperation | Name {
        return this._data;
    }

    key(): string {
        return this._data.queryId() + '_' + this.filter.queryId();
    }

    getDataName() : string {
        return this._data.getDataName();
    }
}

export class DeepBlueMultiParametersOperation implements IKey {
    constructor(public op_one: DeepBlueOperation, public op_two: DeepBlueOperation, public parameters: string[], public command: string) { }

    clone(): DeepBlueMultiParametersOperation {
        return new DeepBlueMultiParametersOperation(this.op_one, this.op_two, this.parameters, this.command);
    }

    key(): string {
        return this.op_one.key() + this.op_two.key() + this.parameters.join();
    }
}

export class DeepBlueRequest implements IKey {
    constructor(private _data: DeepBlueOperation, public request_id: string, public command: string, public operation: DeepBlueOperation, ) { }

    clone(): DeepBlueRequest {
        return new DeepBlueRequest(this._data, this.request_id, this.command, this.operation)
    }

    key(): string {
        return this.request_id;
    }

    data(): DeepBlueOperation {
        return this._data;
    }

    getDataName() : string {
        return this._data.getDataName();
    }

}

export class DeepBlueResult implements ICloneable {
    constructor(private _data: DeepBlueRequest, public result: Object, public request: DeepBlueRequest) { }

    clone(): DeepBlueResult {
        return new DeepBlueResult(this._data, this.result, this.request);
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

    getDataName() : string {
        return this._data.getDataName();
    }
}
