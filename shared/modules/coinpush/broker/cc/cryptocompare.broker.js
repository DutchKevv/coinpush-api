"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_date_1 = require("../../util/util.date");
const querystring_1 = require("querystring");
const events_1 = require("events");
const constant_1 = require("../../constant");
const request = require("requestretry");
const symbols_1 = require("./symbols");
const io = require("socket.io-client");
const util_cc_1 = require("./util.cc");
let currentPrice = {};
class CyrptoCompareApi extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.options = options;
        this._client = null;
    }
    init() {
    }
    async testConnection() {
        return Promise.resolve(true);
    }
    getAccounts() {
        return Promise.resolve();
    }
    getTransactionHistory(minId) {
        return Promise.resolve();
    }
    getOpenOrders() {
        return Promise.resolve();
    }
    subscribeEventStream(callback) {
        this._client.subscribeEvents(event => callback(event));
    }
    unsubscribeEventStream(listener) {
        this._client.unsubscribeEvents(listener);
    }
    subscribePriceStream(symbols) {
        this._socket = io.connect('https://streamer.cryptocompare.com/', {
            reconnectionAttempts: 10000,
            timeout: 1000,
        });
        //Format: {SubscriptionId}~{ExchangeName}~{FromSymbol}~{ToSymbol}
        //Use SubscriptionId 0 for TRADE, 2 for CURRENT and 5 for CURRENTAGG
        //For aggregate quote updates use CCCAGG as market
        const subs = symbols.map(symbol => `5~CCCAGG~${symbol}~USD`);
        this._socket.on("m", (message) => {
            var messageType = message.substring(0, message.indexOf("~"));
            var res = {};
            if (messageType == util_cc_1.CCC.STATIC.TYPE.CURRENTAGG) {
                res = util_cc_1.CCC.CURRENT.unpack(message);
                if (res.LASTMARKET === 'Yobit')
                    return;
                // console.log(res);
                // console.log(typeof res, res);
                // dataUnpack(res);
                // console.log(res);
                if (res.PRICE) {
                    this.emit('tick', {
                        time: res.LASTUPDATE * 1000,
                        instrument: res.FROMSYMBOL,
                        bid: res.PRICE,
                        ask: res.PRICE,
                    });
                }
            }
        });
        this._socket.on('connect', () => {
            console.info('CryptoCompare socket connected');
            this._socket.emit('SubAdd', { subs });
        });
        this._socket.on("disconnect", (message) => {
            console.warn('CryptoCompare socket disconnected');
        });
    }
    unsubscribePriceStream(instruments) {
        this._socket.disconnect();
        this._socket = null;
    }
    async getSymbols() {
        try {
            const result = await request({
                uri: 'https://min-api.cryptocompare.com/data/all/coinlist',
                fullResponse: false,
                json: true
            });
            const normalized = [];
            for (let key in result.Data) {
                const coin = result.Data[key];
                if (symbols_1.symbols.indexOf(coin.Name) === -1)
                    continue;
                normalized.push({
                    type: constant_1.SYMBOL_CAT_TYPE_CRYPTO,
                    name: coin.Name,
                    displayName: coin.CoinName,
                    img: 'https://www.cryptocompare.com' + coin.ImageUrl,
                    broker: constant_1.BROKER_GENERAL_TYPE_CC
                });
            }
            return normalized;
        }
        catch (error) {
            throw error;
        }
    }
    async getCandles(symbol, timeFrame, from, until, count, onData) {
        until = until || Date.now() + (1000 * 60 * 60 * 24);
        let chunks = util_date_1.splitToChunks(timeFrame, from, until, count, CyrptoCompareApi.FETCH_CHUNK_LIMIT), writeChunks = 0, finished = 0, url = '';
        if (!chunks.length)
            return;
        switch (timeFrame) {
            case 'M1':
                url = 'https://min-api.cryptocompare.com/data/histominute?';
                break;
            case 'H1':
                url = 'https://min-api.cryptocompare.com/data/histohour?';
                break;
            case 'D':
                url = 'https://min-api.cryptocompare.com/data/histoday?';
                break;
        }
        for (let i = 0, len = chunks.length; i < len; i++) {
            const chunk = chunks[i];
            const now = Date.now();
            const result = await this._doRequest(url, {
                limit: 2000,
                fsym: symbol,
                tsym: 'USD',
                toTs: chunk.until
            });
            if (!result.Data || !result.Data.length)
                continue;
            let candles = new Float64Array(result.Data.length * 10);
            result.Data.forEach((candle, index) => {
                const startIndex = index * 10;
                const time = candle.time * 1000;
                candles[startIndex] = candle.time * 1000;
                candles[startIndex + 1] = candle.open;
                candles[startIndex + 2] = candle.open;
                candles[startIndex + 3] = candle.high;
                candles[startIndex + 4] = candle.high;
                candles[startIndex + 5] = candle.low;
                candles[startIndex + 6] = candle.low;
                candles[startIndex + 7] = candle.close;
                candles[startIndex + 8] = candle.close;
                candles[startIndex + 9] = Math.ceil(Math.abs(candle.volumeto - candle.volumefrom)); // TODO: can't be right but places BTC -> ETC -> LTC nice in order for some reason..
                // candles[startIndex + 9] = Math.ceil(Math.abs(candle.volumeto - candle.volumefrom));
            });
            await onData(candles);
        }
    }
    async getCurrentPrices(symbols, toSymbol = 'USD') {
        const priceArr = [];
        for (let i = 0, len = symbols.length; i < len; i++) {
            const result = await this._doRequest('https://min-api.cryptocompare.com/data/price?', { fsym: symbols[i], tsyms: toSymbol });
            priceArr.push({ instrument: symbols[i], bid: result[toSymbol] });
        }
        return priceArr;
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
    async _doRequest(url, params, reattempt = 0) {
        try {
            const result = await request({
                uri: url + querystring_1.stringify(params),
                json: true,
                maxAttempts: 3,
                retryDelay: 2000,
                fullResponse: false
            });
            // if (!result || !result.Data)
            //     throw new Error('empty result!');
            return result;
        }
        catch (error) {
            const calls = await this._getCallsInMinute();
            if (!calls || !calls.CallsLeft.Histo) {
                return await new Promise((resolve) => {
                    setTimeout(async () => {
                        resolve(await this._doRequest(url, params, ++reattempt));
                    }, 1000);
                });
            }
            throw error;
        }
    }
    async _getCallsInMinute() {
        try {
            const result = await request({
                uri: 'https://min-api.cryptocompare.com/stats/rate/minute/limit',
                json: true,
                fullResponse: false
            });
            return result;
        }
        catch (error) {
            console.error(error);
        }
    }
}
CyrptoCompareApi.FAVORITE_SYMBOLS = [
    'EUR_USD',
    'BCO_USD',
    'NZD_AUD'
];
CyrptoCompareApi.FETCH_CHUNK_LIMIT = 2000;
CyrptoCompareApi.WRITE_CHUNK_COUNT = 2000;
exports.default = CyrptoCompareApi;
function dataUnpack(data) {
    var from = data['FROMSYMBOL'];
    var to = data['TOSYMBOL'];
    var fsym = util_cc_1.CCC.STATIC.CURRENCY.getSymbol(from);
    var tsym = util_cc_1.CCC.STATIC.CURRENCY.getSymbol(to);
    var pair = from + to;
    if (!currentPrice.hasOwnProperty(pair)) {
        currentPrice[pair] = {};
    }
    for (var key in data) {
        currentPrice[pair][key] = data[key];
    }
    if (currentPrice[pair]['LASTTRADEID']) {
        currentPrice[pair]['LASTTRADEID'] = parseInt(currentPrice[pair]['LASTTRADEID']).toFixed(0);
    }
    currentPrice[pair]['CHANGE24HOUR'] = util_cc_1.CCC.convertValueToDisplay(tsym, (currentPrice[pair]['PRICE'] - currentPrice[pair]['OPEN24HOUR']));
    currentPrice[pair]['CHANGE24HOURPCT'] = ((currentPrice[pair]['PRICE'] - currentPrice[pair]['OPEN24HOUR']) / currentPrice[pair]['OPEN24HOUR'] * 100).toFixed(2) + "%";
    ;
    // displayData(currentPrice[pair], from, tsym, fsym);
}
;
