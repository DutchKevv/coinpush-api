"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
exports.CandleSchema = new mongoose_1.Schema({
    time: {
        type: Date,
        lowercase: true,
        default: Date.now
    },
    data: {
        type: Buffer,
        required: true
    }
});
// authenticate input against database
exports.CandleSchema.statics.follow = function (from, to, callback) {
    exports.Candle.update({
        _id: from,
    }, {
        $inc: { followingCount: 1 },
        $addToSet: { following: to }
    }).exec(function (err) {
        if (err)
            return callback(err);
        callback(null, null);
    });
};
// authenticate input against database
exports.CandleSchema.statics.unFollow = function (from, to, callback) {
    exports.Candle.update({
        _id: from,
    }, {
        $inc: { followingCount: -1 },
        $pull: { following: to }
    }).exec(function (err) {
        if (err)
            return callback(err);
        callback(null, null);
    });
};
exports.Candle = mongoose_1.model('Candle', exports.CandleSchema);
//# sourceMappingURL=candle.js.map