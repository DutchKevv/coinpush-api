import { readFileSync } from 'fs';
import * as Stream from 'stream';
import { splitToChunks, timeFrameSteps } from '../../util/util.date';
import { stringify } from 'querystring';
import { log } from '../../util/util.log';
import { EventEmitter } from 'events';
import { ORDER_TYPE_IF_TOUCHED, ORDER_TYPE_LIMIT, ORDER_TYPE_MARKET, ORDER_TYPE_STOP, BROKER_GENERAL_TYPE_CC, SYMBOL_CAT_TYPE_CRYPTO, ORDER_SIDE_BUY, CANDLE_DEFAULT_ROW_LENGTH } from '../../constant';
import * as request from 'requestretry';
import { symbols } from './symbols';
import * as io from 'socket.io-client';
import { CCC } from './util.cc';

let currentPrice = {};

export default class CyrptoCompareApi extends EventEmitter {

    private _socket: any;
    private _activeSubs: Array<string> = [];
    private _latestBtcUsd = 0;
    private _reconnectTimeout = null;
    private _reconnectTimeoutTime = 10000;

    public static readonly FETCH_CHUNK_LIMIT = 2000;
    public static readonly WRITE_CHUNK_COUNT = 2000;

    private _client = null;

    constructor(public options: any) {
        super();

        this._setupSocketIO();
        this._socket.emit('SubAdd', { subs: [`5~CCCAGG~BTC~USD`] });
    }

    public async testConnection(): Promise<boolean> {
        return Promise.resolve(true);
    }

    public subscribePriceStream(symbols: Array<any>): void {
        //Format: {SubscriptionId}~{ExchangeName}~{FromSymbol}~{ToSymbol}
        //Use SubscriptionId 0 for TRADE, 2 for CURRENT and 5 for CURRENTAGG
        //For aggregate quote updates use CCCAGG as market
        this._activeSubs = symbols.map(symbol => `5~CCCAGG~${symbol.name}~BTC`);
        this._socket.emit('SubAdd', { subs: this._activeSubs });
    }

    public unsubscribePriceStream(instruments) {
        this._socket.disconnect();
        this._socket = null;
    }

    public async getSymbols(): Promise<Array<any>> {
        try {
            const result = await request({
                uri: 'https://min-api.cryptocompare.com/data/all/coinlist',
                fullResponse: false,
                json: true
            });

            const normalized = [];
            for (let key in result.Data) {
                const coin = result.Data[key];

                if (symbols.indexOf(coin.Name) === -1)
                    continue;

                normalized.push({
                    type: SYMBOL_CAT_TYPE_CRYPTO,
                    name: coin.Name,
                    displayName: coin.CoinName,
                    img: 'https://www.cryptocompare.com' + coin.ImageUrl,
                    broker: BROKER_GENERAL_TYPE_CC
                });
            }

            return normalized;

        } catch (error) {
            throw error;
        }
    }

    public async getCandles(symbol: string, timeFrame: string, from: number, until: number, count: number, onData: Function): Promise<void> {
        until = until || Date.now() + (1000 * 60 * 60 * 24);
        let chunks = splitToChunks(timeFrame, from, until, count, CyrptoCompareApi.FETCH_CHUNK_LIMIT),
            writeChunks = 0,
            finished = 0,
            url = '';

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

            const result: any = await this._doRequest(url, {
                limit: count || 400,
                fsym: symbol,
                tsym: 'USD',
                toTs: chunk.until
            });

            if (!result.Data || !result.Data.length)
                continue;

            let candles = new Array(result.Data.length * CANDLE_DEFAULT_ROW_LENGTH);

            result.Data.forEach((candle, index) => {
                const startIndex = index * CANDLE_DEFAULT_ROW_LENGTH;
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

    public async getCurrentPrices(symbols: Array<string>, toSymbol = 'USD'): Promise<Array<any>> {
        const priceArr = [];

        for (let i = 0, len = symbols.length; i < len; i++) {
            const result = await this._doRequest('https://min-api.cryptocompare.com/data/price?', { fsym: symbols[i], tsyms: toSymbol });
            priceArr.push({ instrument: symbols[i], bid: result[toSymbol] });
        }

        return priceArr;
    }

    public placeOrder(options) {
        return new Promise((resolve, reject) => {
            const _options = {
                instrument: options.symbol,
                units: options.amount,
                side: options.side === ORDER_SIDE_BUY ? 'buy' : 'sell',
                type: this.orderTypeConstantToString(options.type)
            };

            this._client.createOrder(this.options.accountId, _options, (err, result) => {
                if (err)
                    return reject(err);

                resolve({
                    openTime: result.time,
                    openPrice: result.price,
                    b_id: result.tradeOpened.id
                })
            });
        });
    }

    public closeOrder(id) {
        return new Promise((resolve, reject) => {
            this._client.closeOrder(this.options.accountId, id, (err, result) => {
                if (err)
                    return reject(err);

                resolve(result);
            });
        });
    }

    public destroy(): void {

        if (this._client)
            this._client.kill();

        this._client = null;
    }

    private orderTypeConstantToString(type) {
        switch (type) {
            case ORDER_TYPE_MARKET:
                return 'market';
            case ORDER_TYPE_LIMIT:
                return 'limit';
            case ORDER_TYPE_STOP:
                return 'stop';
            case ORDER_TYPE_IF_TOUCHED:
                return 'marketIfTouched';
        }
    }

    private async _doRequest(url, params: any, reattempt = 0) {
        try {
            const result = await request({
                uri: url + stringify(params),
                json: true,
                maxAttempts: 3,   // (default) try 5 times 
                retryDelay: 2000,  // (default) wait for 5s before trying again 
                fullResponse: false
            });

            return result;
        } catch (error) {
            const calls = await this._getCallsInMinute();

            if (!calls || !calls.CallsLeft.Histo) {
                return await new Promise((resolve) => {
                    setTimeout(async () => {
                        resolve(await this._doRequest(url, params, ++reattempt));
                    }, 1000);
                })
            }

            throw error;
        }
    }

    private async _getCallsInMinute() {
        try {
            const result = await request({
                uri: 'https://min-api.cryptocompare.com/stats/rate/minute/limit',
                json: true,
                fullResponse: false
            });

            return result;
        } catch (error) {
            console.error(error);
        }
    }

    private _setupSocketIO() {
        this._socket = io.connect('https://streamer.cryptocompare.com/');

        this._socket.on('connect', () => {
            log.info('CryptoCompare socket connected');
            this._socket.emit('SubAdd', { subs: [`5~CCCAGG~BTC~USD`] });
            this._socket.emit('SubAdd', { subs: this._activeSubs });
        });

        this._socket.on("disconnect", (message) => {
            log.info('CryptoCompare socket disconnected, reconnecting and relistening symbols');

            clearTimeout(this._reconnectTimeout);
            this._reconnectTimeout = setTimeout(() => this._socket.connect(), this._reconnectTimeoutTime);
        });

        this._socket.on("connect_error", (error) => {
            log.error('connect error!', error);

            clearTimeout(this._reconnectTimeout);
            this._reconnectTimeout = setTimeout(() => this._socket.connect(), this._reconnectTimeoutTime);
        });

        this._socket.on("reconnect_error", (error) => {
            log.error('reconnect error!', error);

            clearTimeout(this._reconnectTimeout);
            this._reconnectTimeout = setTimeout(() => this._socket.connect(), this._reconnectTimeoutTime);
        });

        // on tick(s)
        this._socket.on("m", (message) => {

            const messageType = message.substring(0, message.indexOf("~"));
            const res = CCC.CURRENT.unpack(message);

            if (res.FROMSYMBOL === 'BTC') {
                if (res.TOSYMBOL === 'BTC')
                    return;

                if (res.TOSYMBOL === 'USD')
                    this._latestBtcUsd = res.PRICE;
            }

            if (this._latestBtcUsd && res.PRICE) {
                if (!(res.FROMSYMBOL === 'BTC' && res.TOSYMBOL === 'USD')) {
                    res.PRICE = parseFloat(<any>(res.PRICE * this._latestBtcUsd)).toPrecision(6);
                }

                this.emit('tick', {
                    time: res.LASTUPDATE * 1000,
                    instrument: res.FROMSYMBOL,
                    bid: res.PRICE
                });
            } else {
                // console.log(res);
            }
        });
    }
}


function dataUnpack(data) {
    var from = data['FROMSYMBOL'];
    var to = data['TOSYMBOL'];
    var fsym = CCC.STATIC.CURRENCY.getSymbol(from);
    var tsym = CCC.STATIC.CURRENCY.getSymbol(to);
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
    currentPrice[pair]['CHANGE24HOUR'] = CCC.convertValueToDisplay(tsym, (currentPrice[pair]['PRICE'] - currentPrice[pair]['OPEN24HOUR']));
    currentPrice[pair]['CHANGE24HOURPCT'] = ((currentPrice[pair]['PRICE'] - currentPrice[pair]['OPEN24HOUR']) / currentPrice[pair]['OPEN24HOUR'] * 100).toFixed(2) + "%";;
    // displayData(currentPrice[pair], from, tsym, fsym);
};