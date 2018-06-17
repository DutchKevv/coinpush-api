import { readFileSync } from 'fs';
import * as Stream from 'stream';
import { splitToChunks, timeFrameSteps } from '../../util/util.date';
import { stringify } from 'querystring';
import { log } from '../../util/util.log';
import { EventEmitter } from 'events';
import { BROKER_GENERAL_TYPE_CC, SYMBOL_CAT_TYPE_CRYPTO, CANDLE_DEFAULT_ROW_LENGTH } from '../../constant/constants';
import * as request from 'requestretry';
import { symbolList } from './symbol-list';
import { activeSymbols } from './symbols-active';
import * as io from 'socket.io-client';

const URL_PREFIX = 'https://ws-api.iextrading.com/1.0';

export default class IEXApi extends EventEmitter {

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
        this._connectSocketIO();
    }

    public async testConnection(): Promise<boolean> {
        return Promise.resolve(true);
    }

    public subscribePriceStream(symbols: Array<any>): void {
        this._activeSubs = symbols.map(symbol => symbol.name);
        this._socket.emit('subscribe', 'snap,fb,aig+');
        this._socket.emit('subscribe', this._activeSubs);
    }

    public unsubscribePriceStream(instruments) {
        this._socket.disconnect();
        this._socket = null;
    }

    public async getSymbols(): Promise<Array<any>> {
        return Promise.resolve(activeSymbols);
    }

    public async getCandles(symbol: string, timeFrame: string, from: number, until: number, count: number, onData: Function): Promise<void> {
        until = until || Date.now() + (1000 * 60 * 60 * 24);
        let chunks = splitToChunks(timeFrame, from, until, count, IEXApi.FETCH_CHUNK_LIMIT),
            writeChunks = 0,
            finished = 0,
            url = '';

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

    public destroy(): void {
        if (this._client)
            this._client.kill();

        this._client = null;
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
        this._socket = io.connect('https://ws-api.iextrading.com/1.0/');

        // Connect to the channel
        this._socket.on('connect', () => {

            // Subscribe to topics (i.e. appl,fb,aig+)
            this._socket.emit('subscribe', 'snap,fb,aig+')

            // Unsubscribe from topics (i.e. aig+)
            // this._socket.emit('unsubscribe', 'aig+')
        })

        this._socket.on("disconnect", (message) => {
            log.info('CryptoCompare socket disconnected, reconnecting and relistening symbols');

            clearTimeout(this._reconnectTimeout);
            this._reconnectTimeout = setTimeout(() => this._connectSocketIO(), this._reconnectTimeoutTime);
        });

        this._socket.on("connect_error", (error) => {
            log.error('connect error!', error);

            clearTimeout(this._reconnectTimeout);
            this._reconnectTimeout = setTimeout(() => this._connectSocketIO(), this._reconnectTimeoutTime);
        });

        this._socket.on("reconnect_error", (error) => {
            log.error('reconnect error!', error);

            clearTimeout(this._reconnectTimeout);
            this._reconnectTimeout = setTimeout(() => this._connectSocketIO(), this._reconnectTimeoutTime);
        });

        // Listen to the channel's messages
        this._socket.on('message', message => {
            console.log('MESSAGE!!!', message);
           
        });
    }

    private _connectSocketIO() {
        this._socket.connect();

        // Subscribe to topics (i.e. appl,fb,aig+)
        // this._socket.emit('subscribe', 'snap,fb,aig+')
    }
}