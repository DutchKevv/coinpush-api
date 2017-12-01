import { readFileSync } from 'fs';
import * as Stream from 'stream';
import { splitToChunks } from '../../util/util.date';
import { stringify } from 'querystring';
import { log } from '../../logger';
import { EventEmitter } from 'events';
import { Base } from '../../classes/Base';
import * as Constants from '../../constants/constants';
import { ORDER_TYPE_IF_TOUCHED, ORDER_TYPE_LIMIT, ORDER_TYPE_MARKET, ORDER_TYPE_STOP, BROKER_GENERAL_TYPE_CC, SYMBOL_CAT_TYPE_CRYPTO } from '../../constants/constants';
import * as request from 'request-promise';
import { symbols } from './symbols';

export default class CyrptoCompareApi extends EventEmitter {

    public static readonly FAVORITE_SYMBOLS = [
        'EUR_USD',
        'BCO_USD',
        'NZD_AUD'
    ];

    public static readonly FETCH_CHUNK_LIMIT = 2000;
    public static readonly WRITE_CHUNK_COUNT = 2000;

    private _client = null;

    constructor(public options: any) {
        super();
    }

    public init() {


    }

    public async testConnection(): Promise<boolean> {
        return Promise.resolve(true);
    }

    public getAccounts(): Promise<any> {
        return Promise.resolve();
    }

    public getTransactionHistory(minId: number): Promise<any> {
        return Promise.resolve();
    }

    public getOpenOrders(): Promise<any> {
        return Promise.resolve();
    }

    public subscribeEventStream(callback: Function) {
        this._client.subscribeEvents(event => callback(event));
    }

    public unsubscribeEventStream(listener: Function) {
        this._client.unsubscribeEvents(listener);
    }

    public subscribePriceStream(symbols: Array<string>): void {
        this._client.subscribePrices(this.options.accountId, symbols, tick => {
            this.emit('tick', tick);
        });
    }

    public unsubscribePriceStream(instruments) {
        this._client.unsubscribePrices(this.options.accountId, instruments, tick => this.emit('tick', tick));
    }

    public async getSymbols(): Promise<Array<any>> {

        try {
            const result = await request({
                uri: 'https://www.cryptocompare.com/api/data/coinlist/',
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
                    img: coin.ImageUrl,
                    broker: BROKER_GENERAL_TYPE_CC
                });
            }

            console.log(`Counted ${normalized.length} valid coins`)

            return normalized;

        } catch (error) {
            throw error;
        }
    }

    public getCandles(symbol: string, timeFrame: string, from: number, until: number, count: number, onData: Function, onDone: Function): void {
        let countChunks = splitToChunks(timeFrame, from, until, count, CyrptoCompareApi.FETCH_CHUNK_LIMIT),
            writeChunks = 0,
            finished = 0;

        countChunks.forEach(async chunk => {
            let arr = [];
            let leftOver = '';
            let startFound = false;
            let now = Date.now();
            let url = '';

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
            const result = await request({
                uri: url + stringify({
                    limit: count,
                    fsym: symbol,
                    tsym: 'USD',
                    toTs: until || undefined
                }),
                json: true
            })

            let candles = new Float64Array(result.Data.length * 10);
           
            result.Data.forEach((candle, index) => {
                const startIndex = index * 10;
                
                candles[startIndex] = candle.time * 1000;
                candles[startIndex + 1] = candle.open;
                candles[startIndex + 2] = candle.open;
                candles[startIndex + 3] = candle.high;
                candles[startIndex + 4] = candle.high;
                candles[startIndex + 5] = candle.low;
                candles[startIndex + 6] = candle.low;
                candles[startIndex + 7] = candle.close;
                candles[startIndex + 8] = candle.close;
                candles[startIndex + 9] = candle.volumeto;
            });

            await onData(candles);

            candles = null;

            if (++finished === countChunks.length)
                onDone();
        });
    }

    public getCurrentPrices(symbols: Array<string>): Promise<Array<any>> {
        return new Promise((resolve, reject) => {

            this._client.getPrices(symbols, (err, prices) => {
                if (err)
                    return reject(err);

                resolve(prices);
            });
        });
    }

    public getOpenPositions() {

    }

    public getOrder(id) {

    }

    public getOrderList(options) {

    }

    public placeOrder(options) {
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

    public updateOrder(id, options) {

    }

    public destroy(): void {
        this.removeAllListeners();

        if (this._client)
            this._client.kill();

        this._client = null;
    }

    private _normalizeJSON(candles) {
        let i = 0, len = candles.length;

        for (; i < len; i++)
            candles[i].time /= 1000;

        return candles;
    }

    private normalizeJsonToArray(candles) {
        let i = 0, len = candles.length, rowLength = 10, candle,
            view = new Float64Array(candles.length * rowLength);

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

    private normalizeTypedArrayToBuffer(array) {
        return new Buffer(array.buffer);
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
}