"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_date_1 = require("../../util/util.date");
const querystring_1 = require("querystring");
const util_log_1 = require("../../util/util.log");
const events_1 = require("events");
const constants_1 = require("../../constant/constants");
const request = require("requestretry");
const symbols_active_1 = require("./symbols-active");
const io = require("socket.io-client");
const URL_PREFIX = 'https://ws-api.iextrading.com/1.0';
class IEXApi extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.options = options;
        this._activeSubs = [];
        this._latestBtcUsd = 0;
        this._reconnectTimeout = null;
        this._reconnectTimeoutTime = 10000;
        this._client = null;
        this._setupSocketIO();
        this._connectSocketIO();
    }
    async testConnection() {
        return Promise.resolve(true);
    }
    subscribePriceStream(symbols) {
        this._activeSubs = symbols.map(symbol => symbol.name);
        this._socket.emit('subscribe', 'snap,fb,aig+');
        this._socket.emit('subscribe', this._activeSubs);
    }
    unsubscribePriceStream(instruments) {
        this._socket.disconnect();
        this._socket = null;
    }
    async getSymbols() {
        return Promise.resolve(symbols_active_1.activeSymbols);
    }
    async getCandles(symbol, timeFrame, from, until, count, onData) {
        until = until || Date.now() + (1000 * 60 * 60 * 24);
        let chunks = util_date_1.splitToChunks(timeFrame, from, until, count, IEXApi.FETCH_CHUNK_LIMIT), writeChunks = 0, finished = 0, url = '';
        if (!chunks.length)
            return;
        switch (timeFrame) {
            case 'M1':
                url = `${URL_PREFIX}/stock/${symbol}/chart/1d`;
                url = 'https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=MSFT&interval=1min&apikey=demo';
                break;
            case 'H1':
                url = `${URL_PREFIX}/stock/${symbol}/chart/1d`;
                break;
            case 'D':
                url = `${URL_PREFIX}/stock/${symbol}/chart/1d`;
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
        this._socket = io.connect('https://ws-api.iextrading.com/1.0/');
        // Connect to the channel
        this._socket.on('connect', () => {
            // Subscribe to topics (i.e. appl,fb,aig+)
            this._socket.emit('subscribe', 'snap,fb,aig+');
            // Unsubscribe from topics (i.e. aig+)
            // this._socket.emit('unsubscribe', 'aig+')
        });
        this._socket.on("disconnect", (message) => {
            util_log_1.log.info('CryptoCompare socket disconnected, reconnecting and relistening symbols');
            clearTimeout(this._reconnectTimeout);
            this._reconnectTimeout = setTimeout(() => this._connectSocketIO(), this._reconnectTimeoutTime);
        });
        this._socket.on("connect_error", (error) => {
            util_log_1.log.error('connect error!', error);
            clearTimeout(this._reconnectTimeout);
            this._reconnectTimeout = setTimeout(() => this._connectSocketIO(), this._reconnectTimeoutTime);
        });
        this._socket.on("reconnect_error", (error) => {
            util_log_1.log.error('reconnect error!', error);
            clearTimeout(this._reconnectTimeout);
            this._reconnectTimeout = setTimeout(() => this._connectSocketIO(), this._reconnectTimeoutTime);
        });
        // Listen to the channel's messages
        this._socket.on('message', message => {
            console.log('MESSAGE!!!', message);
        });
    }
    _connectSocketIO() {
        this._socket.connect();
        // Subscribe to topics (i.e. appl,fb,aig+)
        // this._socket.emit('subscribe', 'snap,fb,aig+')
    }
}
IEXApi.FETCH_CHUNK_LIMIT = 2000;
IEXApi.WRITE_CHUNK_COUNT = 2000;
exports.default = IEXApi;
//# sourceMappingURL=iex.js.map