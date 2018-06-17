"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_date_1 = require("../../util/util.date");
const querystring_1 = require("querystring");
const util_log_1 = require("../../util/util.log");
const events_1 = require("events");
const constants_1 = require("../../constant/constants");
const request = require("requestretry");
const symbols_1 = require("./symbols");
const io = require("socket.io-client");
const util_cc_1 = require("./util.cc");
let currentPrice = {};
class CyrptoCompareApi extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.options = options;
        this._activeSubs = [];
        this._latestBtcUsd = 0;
        this._reconnectTimeout = null;
        this._reconnectTimeoutTime = 10000;
        this._client = null;
        this._setupSocketIO();
        this._socket.emit('SubAdd', { subs: [`5~CCCAGG~BTC~USD`] });
    }
    async testConnection() {
        return Promise.resolve(true);
    }
    subscribePriceStream(symbols) {
        //Format: {SubscriptionId}~{ExchangeName}~{FromSymbol}~{ToSymbol}
        //Use SubscriptionId 0 for TRADE, 2 for CURRENT and 5 for CURRENTAGG
        //For aggregate quote updates use CCCAGG as market
        this._activeSubs = symbols.map(symbol => `5~CCCAGG~${symbol.name}~BTC`);
        this._socket.emit('SubAdd', { subs: this._activeSubs });
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
                constants_1.SYMBOL_CAT_TYPE_COMPANY;
                normalized.push({
                    type: constants_1.SYMBOL_CAT_TYPE_CRYPTO,
                    name: coin.Name,
                    displayName: coin.CoinName,
                    img: 'https://www.cryptocompare.com' + coin.ImageUrl,
                    broker: constants_1.BROKER_GENERAL_TYPE_CC
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
            const result = await this._doRequest(url, {
                limit: count || 400,
                fsym: symbol,
                tsym: 'USD',
                toTs: chunk.until
            });
            if (!result.Data || !result.Data.length)
                continue;
            let candles = new Array(result.Data.length * constants_1.CANDLE_DEFAULT_ROW_LENGTH);
            result.Data.forEach((candle, index) => {
                const startIndex = index * constants_1.CANDLE_DEFAULT_ROW_LENGTH;
                const time = candle.time * 1000;
                candles[startIndex] = candle.time * 1000;
                candles[startIndex + 1] = candle.open;
                candles[startIndex + 2] = candle.high;
                candles[startIndex + 3] = candle.low;
                candles[startIndex + 4] = candle.close;
                candles[startIndex + 5] = Math.ceil(Math.abs(candle.volumeto - candle.volumefrom)); // TODO: can't be right but places BTC -> ETC -> LTC nice in order for some reason..
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
    destroy() {
        if (this._client)
            this._client.kill();
        this._client = null;
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
    _setupSocketIO() {
        this._socket = io.connect('https://streamer.cryptocompare.com/');
        this._socket.on('connect', () => {
            util_log_1.log.info('CryptoCompare', 'Socket connected');
            this._socket.emit('SubAdd', { subs: [`5~CCCAGG~BTC~USD`] });
            this._socket.emit('SubAdd', { subs: this._activeSubs });
        });
        this._socket.on("disconnect", (message) => {
            util_log_1.log.info('CryptoCompare', 'Socket disconnected, reconnecting and relistening symbols');
            clearTimeout(this._reconnectTimeout);
            this._reconnectTimeout = setTimeout(() => this._socket.connect(), this._reconnectTimeoutTime);
        });
        this._socket.on("connect_error", (error) => {
            util_log_1.log.error('connect error!', error);
            clearTimeout(this._reconnectTimeout);
            this._reconnectTimeout = setTimeout(() => this._socket.connect(), this._reconnectTimeoutTime);
        });
        this._socket.on("reconnect_error", (error) => {
            util_log_1.log.error('reconnect error!', error);
            clearTimeout(this._reconnectTimeout);
            this._reconnectTimeout = setTimeout(() => this._socket.connect(), this._reconnectTimeoutTime);
        });
        // on tick(s)
        this._socket.on("m", (message) => {
            const messageType = message.substring(0, message.indexOf("~"));
            const res = util_cc_1.CCC.CURRENT.unpack(message);
            if (res.FROMSYMBOL === 'BTC') {
                if (res.TOSYMBOL === 'BTC')
                    return;
                if (res.TOSYMBOL === 'USD')
                    this._latestBtcUsd = res.PRICE;
            }
            if (this._latestBtcUsd && res.PRICE) {
                if (!(res.FROMSYMBOL === 'BTC' && res.TOSYMBOL === 'USD')) {
                    res.PRICE = parseFloat((res.PRICE * this._latestBtcUsd)).toPrecision(6);
                }
                this.emit('tick', {
                    time: res.LASTUPDATE * 1000,
                    instrument: res.FROMSYMBOL,
                    bid: res.PRICE
                });
            }
            else {
                // console.log(res);
            }
        });
    }
}
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
//# sourceMappingURL=cryptocompare.broker.js.map