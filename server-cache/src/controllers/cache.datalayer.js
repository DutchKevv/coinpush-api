"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const logger_1 = require("../../../shared/logger");
const util_date_1 = require("../../../shared/util/util.date");
const candle_1 = require("../schemas/candle");
const config = require('../../../tradejs.config');
/**
 *  Database
 */
const db = mongoose.connection;
mongoose.Promise = global.Promise;
mongoose.connect(config.server.cache.connectionString);
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('Cache DB connected');
});
exports.dataLayer = {
    async read(params) {
        let symbol = params.symbol, timeFrame = params.timeFrame, from = params.from, until = params.until, count = params.count;
        const model = mongoose.model(this.getCollectionName(symbol, timeFrame));
        const qs = { time: {} };
        if (from)
            qs.time['$gt'] = from;
        if (until)
            qs.time['$lt'] = until;
        const rows = await model.find(qs).limit(count || 1000);
        return Buffer.concat(rows.map(row => row.data), rows.length * (10 * Float64Array.BYTES_PER_ELEMENT));
    },
    async write(symbol, timeFrame, buffer) {
        if (!buffer.length)
            return;
        if (buffer.length % Float64Array.BYTES_PER_ELEMENT !== 0)
            throw Error(`DataLayer: Illegal buffer length, should be multiple of 8 (is ${buffer.length})`);
        let model = mongoose.model(this.getCollectionName(symbol, timeFrame)), rowLength = 10 * Float64Array.BYTES_PER_ELEMENT, i = 0;
        const documents = [];
        while (i < buffer.byteLength)
            documents.push({ time: buffer.readDoubleLE(i, true), data: buffer.slice(i, i += rowLength) });
        return model.insertMany(documents);
    },
    setModels(symbols) {
        let timeFrames = Object.keys(util_date_1.timeFrameSteps);
        logger_1.log.info('DataLayer', 'Creating ' + symbols.length * timeFrames.length + ' tables');
        symbols.forEach(symbol => {
            timeFrames.forEach(timeFrame => {
                mongoose.model(this.getCollectionName(symbol, timeFrame), candle_1.CandleSchema);
            });
        });
    },
    getCollectionName(symbol, timeFrame) {
        return symbol.toLowerCase() + '_' + timeFrame.toLowerCase();
    },
    async reset(symbol, timeFrame, from, until) {
        // TODO
    }
};
//# sourceMappingURL=cache.datalayer.js.map