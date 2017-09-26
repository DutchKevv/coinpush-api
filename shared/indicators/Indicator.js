"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class Indicator {
    constructor(ticks, options = {}) {
        this.ticks = ticks;
        this.options = options;
        this.drawBuffers = [];
        this.init();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    add(id, time, data) {
        this.getById(id).data.push([time, data]);
    }
    addDrawBuffer(settings) {
        if (this.getById(settings.id))
            throw new Error(`Buffer with name [${settings.id}] already exists`);
        settings.data = settings.data || [];
        this.drawBuffers.push(settings);
    }
    getDrawBuffersData(count = 1, offset = 0, from, until) {
        return this.drawBuffers.map(db => ({
            id: db.id,
            type: db.type,
            style: db.style,
            data: this._getDrawBufferData(db.id, count, offset, from, until)
        }));
    }
    getById(id) {
        return this.drawBuffers.find(db => db.id === id);
    }
    _getDrawBufferData(id, count, offset, from, until) {
        let data = this.getById(id).data, start, end;
        if ((from && until) || (count && from)) {
            start = data.findIndex(point => point >= from);
            end = until ? data.lastIndexOf(point => point < until) : Math.min(data.length, start + count);
        }
        else {
            end = Math.max(data.lastIndexOf(point => point < until), data.length - 1);
            start = Math.max(0, Math.max(0, end - count));
        }
        return data.slice(start, end);
    }
    _doCatchUp() {
        let len = this.ticks.length, i = 0, tick;
        for (; i < len; i++) {
            tick = this.ticks[i];
            this.onTick(tick[0], tick[1], len - i);
        }
    }
    onTick(bid, ask, shift = 0) {
    }
}
exports.default = Indicator;
//# sourceMappingURL=Indicator.js.map