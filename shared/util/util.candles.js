"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isForwardDirection = (candles) => {
    if (candles.length > 1) {
        return !!(candles[0] < candles[6]);
    }
    return null;
};

//# sourceMappingURL=util.candles.js.map
