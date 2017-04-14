import { IKey } from 'app/domain/interfaces';
import { ICloneable } from 'app/domain/interfaces';

export class DataCache<T extends IKey, V extends ICloneable> {

    constructor(private _data: Map<string, V> = new Map()) { }

    put(key: T, value: V) {
        let cloneValue = value.clone(-1);
        this._data.set(key.key(), cloneValue);
        console.log(this._data);
    }

    get(key: T, request_count: number): V {
        let value: V = this._data.get(key.key());
        if (value) {
            console.log("cache hit", value);
            return value.clone(request_count);
        } else {
            return null;
        }
    }
}

export class MultiKeyDataCache<T extends IKey, V extends ICloneable> {

    constructor(private _data: Map<string, V> = new Map()) { }

    put(keys: T[], value: V) {
        let key_value = keys.map((k) => k.key()).join();
        let cloneValue = value.clone(-1);
        this._data.set(key_value, cloneValue);
        console.log(this._data);
    }

    get(keys: T[], request_count: number): V {
        let key_value = keys.map((k) => k.key()).join();
        let value: V = this._data.get(key_value);
        if (value) {
            console.log("multikey cache hit", value);
            return value.clone(request_count);
        } else {
            return null;
        }
    }
}