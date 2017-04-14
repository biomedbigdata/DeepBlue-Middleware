"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DataCache {
    constructor(_data = new Map()) {
        this._data = _data;
    }
    put(key, value) {
        let cloneValue = value.clone(-1);
        this._data.set(key.key(), cloneValue);
        console.log(this._data);
    }
    get(key, request_count) {
        let value = this._data.get(key.key());
        if (value) {
            console.log("cache hit", value);
            return value.clone(request_count);
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
        let cloneValue = value.clone(-1);
        this._data.set(key_value, cloneValue);
        console.log(this._data);
    }
    get(keys, request_count) {
        let key_value = keys.map((k) => k.key()).join();
        let value = this._data.get(key_value);
        if (value) {
            console.log("multikey cache hit", value);
            return value.clone(request_count);
        }
        else {
            return null;
        }
    }
}
exports.MultiKeyDataCache = MultiKeyDataCache;
