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
const Indicator_1 = require("../Indicator");
class MA extends Indicator_1.default {
    get value() {
        let drawBuffer = this.getById('MA').data, last = drawBuffer[drawBuffer.length - 1];
        return last ? last[1] : null;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.addDrawBuffer({
                id: 'MA',
                type: 'line',
                style: {
                    color: this.options.color
                }
            });
        });
    }
    onTick(bid, ask, shift = 0) {
        if (this.ticks.length < (this.options.period + shift))
            return;
        let ticks = this.ticks.slice((this.ticks.length - shift) - this.options.period, this.ticks.length - shift);
        let time = ticks[ticks.length - 1][0], sum = 0, i = 0, len = ticks.length;
        for (; i < len; i++) {
            sum += ticks[i][2];
        }
        this.add('MA', time, Number((sum / len).toFixed(4)));
    }
}
exports.default = MA;
//# sourceMappingURL=index.js.map