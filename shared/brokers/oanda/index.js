"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Stream = require("stream");
const OANDAAdapter_1 = require("./lib/OANDAAdapter");
const util_date_1 = require("../../util/util.date");
const logger_1 = require("../../logger");
const Base_1 = require("../../classes/Base");
const Constants = require("../../constants/constants");
const constants_1 = require("../../constants/constants");
class OandaApi extends Base_1.Base {
    constructor() {
        super(...arguments);
        this._client = null;
    }
    async init() {
        await super.init();
        this._client = new OANDAAdapter_1.Adapter({
            // 'live', 'practice' or 'sandbox'
            environment: this.options.environment,
            // Generate your API access in the 'Manage API Access' section of 'My Account' on OANDA's website
            accessToken: this.options.token,
            // Optional. Required only if environment is 'sandbox'
            username: this.options.username
        });
    }
    async testConnection() {
        // TODO: Stupid way to check, and should also check heartbeat
        try {
            await this.getAccounts();
            return true;
        }
        catch (error) {
            return false;
        }
    }
    getAccounts() {
        return new Promise((resolve, reject) => {
            this._client.getAccounts(function (err, accounts) {
                if (err)
                    return reject(err);
                resolve(accounts);
            });
        });
    }
    subscribeEventStream() {
        this._client.subscribeEvents(function (event) {
            console.log(event);
        }, this);
    }
    subscribePriceStream(instruments) {
        this._client.subscribePrices(this.options.accountId, instruments, tick => this.emit('tick', tick));
    }
    unsubscribePriceStream(instruments) {
        this._client.unsubscribePrices(this.options.accountId, instruments, tick => this.emit('tick', tick));
    }
    getSymbols() {
        return new Promise((resolve, reject) => {
            this._client.getInstruments(this.options.accountId, (err, symbols) => {
                if (err)
                    return reject(err);
                symbols.forEach(symbol => {
                    symbol.name = symbol.instrument;
                    delete symbol.instrument;
                });
                resolve(symbols);
            });
        });
    }
    getCandles(symbol, timeFrame, from, until, count, onData, onDone) {
        let countChunks = util_date_1.splitToChunks(timeFrame, from, until, count, OandaApi.FETCH_CHUNK_LIMIT), writeChunks = 0, finished = 0;
        countChunks.forEach(chunk => {
            let arr = [];
            let leftOver = '';
            let startFound = false;
            let now = Date.now();
            let transformStream = new Stream.Transform();
            transformStream._transform = function (data, type, done) {
                if (!this._firstByte) {
                    this._firstByte = true;
                    logger_1.log.info('OANDA', `FirstByte of ${symbol} took: ${Date.now() - now} ms`);
                }
                if (!startFound) {
                    let start = data.indexOf(91);
                    if (start > -1) {
                        startFound = true;
                        data = data.slice(start, data.length);
                    }
                    else {
                        return done();
                    }
                }
                let valArr = (leftOver + data.toString()).split(':');
                leftOver = valArr.pop();
                valArr.forEach(val => {
                    let value = val.replace(/[^\d\.]/g, '');
                    if (typeof value === 'string' && value !== '')
                        arr.push(+value);
                });
                let maxIndex = this._lastPiece ? arr.length : (Math.floor(arr.length / OandaApi.FETCH_CHUNK_LIMIT) * OandaApi.FETCH_CHUNK_LIMIT), buf;
                // if (this._lastPiece)
                if (maxIndex === 0)
                    return done();
                buf = Buffer.alloc(maxIndex * Float64Array.BYTES_PER_ELEMENT, 0, 'binary');
                arr.forEach((value, index) => {
                    if (index < maxIndex)
                        buf.writeDoubleLE(index % 10 ? value : value / 1000, index * Float64Array.BYTES_PER_ELEMENT, false);
                });
                writeChunks++;
                transformStream.push(buf);
                arr = arr.slice(maxIndex, arr.length);
                done();
            };
            // Make Typescript happy (does not know _flush)
            transformStream._flush = function (done) {
                this._lastPiece = true;
                this.push();
                done();
            };
            this._client.getCandles(symbol, chunk.from, chunk.until, timeFrame, chunk.count)
                .pipe(transformStream)
                .on('data', onData)
                .on('error', onDone)
                .on('end', () => {
                if (++finished === countChunks.length)
                    onDone(null, writeChunks);
            });
        });
    }
    getCurrentPrices(symbols) {
        return new Promise((resolve, reject) => {
            this._client.getPrices(symbols, (err, prices) => {
                if (err)
                    return reject(err);
                resolve(prices);
            });
        });
    }
    getOpenPositions() {
    }
    getOrder(id) {
    }
    getOrderList(options) {
    }
    placeOrder(options) {
        return new Promise((resolve, reject) => {
            const _options = {
                instrument: options.symbol,
                units: options.amount,
                side: options.side === Constants.ORDER_SIDE_BUY ? 'buy' : 'sell',
                type: this.orderTypeConstantToString(options.type)
            };
            this._client.createOrder(this.options.accountId, _options, (err, result) => {
                if (err)
                    return reject(err);
                console.log(result.tradeOpened.id);
                console.log('asfasfsdf', result);
                resolve({
                    openTime: result.time,
                    openPrice: result.price,
                    b_id: result.tradeOpened.id || result.tradesClosed[0].id
                });
            });
        });
    }
    removeOrder(id) {
    }
    updateOrder(id, options) {
    }
    destroy() {
        this.removeAllListeners();
        if (this._client)
            this._client.kill();
        this._client = null;
    }
    _normalizeJSON(candles) {
        let i = 0, len = candles.length;
        for (; i < len; i++)
            candles[i].time /= 1000;
        return candles;
    }
    normalizeJsonToArray(candles) {
        let i = 0, len = candles.length, rowLength = 10, candle, view = new Float64Array(candles.length * rowLength);
        for (; i < len; i++) {
            candle = candles[i];
            view[i * rowLength] = candle.time / 1000;
            view[(i * rowLength) + 1] = candle.openBid;
            view[(i * rowLength) + 2] = candle.openAsk;
            view[(i * rowLength) + 3] = candle.highBid;
            view[(i * rowLength) + 4] = candle.highAsk;
            view[(i * rowLength) + 5] = candle.lowBid;
            view[(i * rowLength) + 6] = candle.lowAsk;
            view[(i * rowLength) + 7] = candle.closeBid;
            view[(i * rowLength) + 8] = candle.closeAsk;
            view[(i * rowLength) + 9] = candle.volume;
        }
        return view;
    }
    normalizeTypedArrayToBuffer(array) {
        return new Buffer(array.buffer);
    }
    orderTypeConstantToString(type) {
        switch (type) {
            case constants_1.ORDER_TYPE_MARKET:
                return 'market';
            case constants_1.ORDER_TYPE_LIMIT:
                return 'limit';
            case constants_1.ORDER_TYPE_STOP:
                return 'stop';
            case constants_1.ORDER_TYPE_IF_TOUCHED:
                return 'marketIfTouched';
        }
    }
}
OandaApi.FAVORITE_SYMBOLS = [
    'EUR_USD',
    'BCO_USD',
    'NZD_AUD'
];
OandaApi.FETCH_CHUNK_LIMIT = 5000;
OandaApi.WRITE_CHUNK_COUNT = 5000;
exports.default = OandaApi;
//# sourceMappingURL=index.js.map