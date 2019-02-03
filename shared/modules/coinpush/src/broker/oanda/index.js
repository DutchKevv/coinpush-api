"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const OANDAAdapter_1 = require("./lib/OANDAAdapter");
const util_date_1 = require("../../util/util.date");
const events_1 = require("events");
const constants_1 = require("../../constant/constants");
const metaData = require('./symbols-meta').meta;
class OandaApi extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.options = options;
        this._client = null;
        this._priceStreamSymbols = [];
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
                this.unsubscribePriceStream();
                this.subscribePriceStream();
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
        if (symbols) {
            this._priceStreamSymbols = symbols.map(symbol => symbol.name);
        }
        this._client.subscribePrices(this.options.accountId, this._priceStreamSymbols, tick => this._onPriceUpdateCallback(tick));
    }
    unsubscribePriceStream() {
        this._client.unsubscribePrices(this.options.accountId, this._priceStreamSymbols);
    }
    getSymbols() {
        return new Promise((resolve, reject) => {
            this._client.getInstruments(this.options.accountId, (err, symbols) => {
                if (err)
                    return reject(err);
                const normalized = symbols.map(symbol => {
                    const meta = metaData.find(m => m.name === symbol.instrument);
                    return {
                        precision: -Math.floor(Math.log(symbol.precision) / Math.log(10) + 1),
                        img: '/image/default/symbol/spx500-70x70.png',
                        name: symbol.instrument,
                        displayName: symbol.displayName,
                        broker: constants_1.BROKER_GENERAL_TYPE_OANDA,
                        type: meta ? meta.type : constants_1.SYMBOL_CAT_TYPE_OTHER
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
                        const candles = new Array(data.candles.length * constants_1.CANDLE_DEFAULT_ROW_LENGTH);
                        data.candles.forEach((candle, index) => {
                            const startIndex = index * constants_1.CANDLE_DEFAULT_ROW_LENGTH;
                            candles[startIndex] = candle.time / 1000;
                            candles[startIndex + 1] = candle.openAsk - ((candle.openAsk - candle.openBid) / 2);
                            // candles[startIndex + 1] = candle.openAsk - ((candle.openAsk - candle.openBid) / 2);
                            candles[startIndex + 2] = candle.highAsk - ((candle.highAsk - candle.highBid) / 2);
                            candles[startIndex + 3] = candle.lowAsk - ((candle.lowAsk - candle.lowBid) / 2);
                            candles[startIndex + 4] = candle.closeAsk - ((candle.closeAsk - candle.closeBid) / 2);
                            candles[startIndex + 5] = candle.volume;
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
    placeOrder(options) {
        return new Promise((resolve, reject) => {
            const _options = {
                instrument: options.symbol,
                units: options.amount,
                side: options.side === constants_1.ORDER_SIDE_BUY ? 'buy' : 'sell',
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
        if (this._client)
            this._client.kill();
        this._client = null;
    }
    _onPriceUpdateCallback(tick) {
        tick.bid = (tick.ask - (tick.ask - tick.bid) / 2).toPrecision(6);
        this.emit('tick', tick);
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
exports.OandaApi = OandaApi;
//# sourceMappingURL=index.js.map