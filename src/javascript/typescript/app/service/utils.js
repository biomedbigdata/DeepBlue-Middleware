"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Utils {
    static rnd(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
}
exports.Utils = Utils;
