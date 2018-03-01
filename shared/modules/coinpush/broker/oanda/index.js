"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const OANDAAdapter_1 = require("./lib/OANDAAdapter");
const util_date_1 = require("../../util/util.date");
const events_1 = require("events");
const constant_1 = require("../../constant");
const metaData = require('./symbols-meta').meta;
class OandaApi extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.options = options;
        this._client = null;
    }
    init() {
        this._client = new OANDAAdapter_1.OandaAdapter({
            // 'live', 'practice' or 'sandbox'
            environment: this.options.environment,
            // Generate your API access in the 'Manage API Access' section of 'My Account' on OANDA's website
            accessToken: this.options.token,
            // Optional. Required only if environment is 'sandbox'
            username: this.options.username
        });
        this._client.on('stream-timeout', () => {
            try {
                this.emit('stream-timeout');
            }
            catch (error) {
                console.log(error);
            }
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
    getTransactionHistory(minId) {
        return new Promise((resolve, reject) => {
            this._client.getTransactionHistory(this.options.accountId, minId, (err, transactions) => {
                if (err)
                    return reject(err);
                resolve(transactions.reverse());
            });
        });
    }
    getOpenOrders() {
        return new Promise((resolve, reject) => {
            this._client.getOpenTrades(this.options.accountId, (err, orders) => {
                if (err)
                    return reject(err);
                resolve(orders);
            });
        });
    }
    subscribeEventStream(callback) {
        this._client.subscribeEvents(event => callback(event));
    }
    unsubscribeEventStream(listener) {
        this._client.unsubscribeEvents(listener);
    }
    subscribePriceStream(symbols) {
        this._client.subscribePrices(this.options.accountId, symbols, tick => {
            this.emit('tick', tick);
        });
    }
    unsubscribePriceStream(instruments) {
        this._client.unsubscribePrices(this.options.accountId, instruments, tick => this.emit('tick', tick));
    }
    getSymbols() {
        return new Promise((resolve, reject) => {
            this._client.getInstruments(this.options.accountId, (err, symbols) => {
                if (err)
                    return reject(err);
                const normalized = symbols.map(symbol => {
                    const meta = metaData.find(m => m.name === symbol.name);
                    return {
                        precision: -Math.floor(Math.log(symbol.precision) / Math.log(10) + 1),
                        img: '/images/default/symbol/spx500-70x70.png',
                        name: symbol.instrument,
                        displayName: symbol.displayName,
                        broker: constant_1.BROKER_GENERAL_TYPE_OANDA,
                        type: meta ? meta.type : constant_1.SYMBOL_CAT_TYPE_OTHER
                    };
                });
                resolve(normalized);
            });
        });
    }
    /**
     *
     * @param symbol
     * @param timeFrame
     * @param from
     * @param until
     * @param count
     * @param onData
     */
    async getCandles(symbol, timeFrame, from, until, count, onData) {
        if (!count && !until)
            until = Date.now();
        let chunks = util_date_1.splitToChunks(timeFrame, from, until, count, OandaApi.FETCH_CHUNK_LIMIT), writeChunks = 0, finished = 0;
        if (!chunks.length)
            return;
        for (let i = 0, len = chunks.length; i < len; i++) {
            let chunk = chunks[i];
            await new Promise((resolve, reject) => {
                this._client.getCandles(symbol, chunk.from, chunk.until, timeFrame, chunk.count, async (error, data) => {
                    if (error)
                        return console.error(error);
                    if (data.candles && data.candles.length) {
                        const candles = new Float64Array(data.candles.length * 10);
                        data.candles.forEach((candle, index) => {
                            const startIndex = index * 10;
                            candles[startIndex] = candle.time / 1000;
                            candles[startIndex + 1] = candle.openBid;
                            candles[startIndex + 2] = candle.openAsk;
                            candles[startIndex + 3] = candle.highBid;
                            candles[startIndex + 4] = candle.highAsk;
                            candles[startIndex + 5] = candle.lowBid;
                            candles[startIndex + 6] = candle.lowAsk;
                            candles[startIndex + 7] = candle.closeBid;
                            candles[startIndex + 8] = candle.closeAsk;
                            candles[startIndex + 9] = candle.volume;
                        });
                        await onData(candles);
                    }
                    resolve();
                });
            });
        }
    }
    /**
     *
     * @param symbols
     */
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
                side: options.side === constant_1.ORDER_SIDE_BUY ? 'buy' : 'sell',
                type: this.orderTypeConstantToString(options.type)
            };
            this._client.createOrder(this.options.accountId, _options, (err, result) => {
                if (err)
                    return reject(err);
                resolve({
                    openTime: result.time,
                    openPrice: result.price,
                    b_id: result.tradeOpened.id
                });
            });
        });
    }
    closeOrder(id) {
        return new Promise((resolve, reject) => {
            this._client.closeOrder(this.options.accountId, id, (err, result) => {
                if (err)
                    return reject(err);
                resolve(result);
            });
        });
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
            case constant_1.ORDER_TYPE_MARKET:
                return 'market';
            case constant_1.ORDER_TYPE_LIMIT:
                return 'limit';
            case constant_1.ORDER_TYPE_STOP:
                return 'stop';
            case constant_1.ORDER_TYPE_IF_TOUCHED:
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
exports.OandaApi = OandaApi;
//# sourceMappingURL=index.js.map