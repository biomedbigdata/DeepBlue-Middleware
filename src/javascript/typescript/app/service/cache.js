"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DataCache {
    constructor(_data = new Map()) {
        this._data = _data;
    }
    put(key, value) {
        let cloneValue = value.clone();
        this._data.set(key.key(), cloneValue);
    }
    get(key) {
        console.log(key);
        let value = this._data.get(key.key());
        if (value) {
            return value.clone();
        }
        else {
            return null;
        }
    }
}
exports.DataCache = DataCache;
class MultiKeyDataCache {
    constructor(_data = new Map()) {
        this._data = _data;
    }
    put(keys, value) {
        let key_value = keys.map((k) => k.key()).join();
        let cloneValue = value.clone();
        this._data.set(key_value, cloneValue);
    }
    get(keys) {
        let key_value = keys.map((k) => k.key()).join();
        let value = this._data.get(key_value);
        if (value) {
            return value.clone();
        }
        else {
            return null;
        }
    }
}
exports.MultiKeyDataCache = MultiKeyDataCache;
