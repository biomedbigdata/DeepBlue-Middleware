import { IKey } from '../domain/interfaces';
import { ICloneable } from '../domain/interfaces';

export class DataCache<T extends IKey, V extends ICloneable> {

    constructor(private _data: Map<string, V> = new Map()) { }

    put(key: T, value: V) {
        let cloneValue = value.clone();
        this._data.set(key.key(), cloneValue);
    }

    get(key: T): V {
        console.log(key);
        let value: V = this._data.get(key.key());
        if (value) {
            return value.clone();
        } else {
            return null;
        }
    }
}

export class MultiKeyDataCache<T extends IKey, V extends ICloneable> {

    constructor(private _data: Map<string, V> = new Map()) { }

    put(keys: T[], value: V) {
        let key_value = keys.map((k) => k.key()).join();
        let cloneValue = value.clone();
        this._data.set(key_value, cloneValue);
    }

    get(keys: T[]): V {
        let key_value = keys.map((k) => k.key()).join();
        let value: V = this._data.get(key_value);
        if (value) {
            return value.clone();
        } else {
            return null;
        }
    }
}