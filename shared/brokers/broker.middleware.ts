import * as IB from 'ib';
import * as fs from 'fs';
import * as parser from 'xml2json';
import OandaApi from './oanda/index';
import { EventEmitter } from 'events';
import CyrptoCompareApi from './cc/cryptocompare.broker';
import { BROKER_GENERAL_TYPE_CC, BROKER_GENERAL_TYPE_OANDA } from '../constants/constants';

const config = require('../../tradejs.config');

export class BrokerMiddleware extends EventEmitter {

    private _symbols: Array<any> = [];

    get symbols() {
        return this._symbols;
    }

    set symbols(symbols) {
        this._symbols = symbols;
    }

    constructor() {
        super();

        this._installBrokerOanda();
        // this._installBrokerIb();
        this._installBrokerCC();
    }

    private _brokers: { ib: IB, oanda: OandaApi, cc: CyrptoCompareApi } = {
        ib: null,
        oanda: null,
        cc: null
    }

    public async setSymbols(): Promise<void> {
        const results = await Promise.all([this._brokers.oanda.getSymbols(), this._brokers.cc.getSymbols()]);

        this.symbols = [].concat(...results).sort((a, b) => {
            return a.displayName.localeCompare(b.displayName);
        });

        // this.symbols = [].concat(...results).sort((a, b) => {
        //     return a.displayName.localeCompare(b.displayName);
        // }).slice(0, 10);

        // add marks placeholder (Hour / Day)
        this.symbols.forEach(symbol => {
            symbol.marks = {
                H: undefined,
                D: undefined
            }
        })
    }

    public async getCurrentPrices(symbols: Array<any>): Promise<Array<any>> {
        const brokers = this.splitSymbolsToBrokers(symbols);
        const pList = [];

        if (brokers.oanda.length)
            pList.push(this._brokers.oanda.getCurrentPrices(brokers.oanda));

        if (brokers.cc.length)
            pList.push(this._brokers.cc.getCurrentPrices(brokers.cc));

        const result = [].concat(...(await Promise.all(pList)));

        return
    }

    public getCandles(symbolName, from, until, granularity, count, onData, onDone) {
        const symbol = this.symbols.find(symbol => symbol.name === symbolName);

        if (!symbol) {
            throw new Error('Symbol not found: ' + symbolName);
        }

        if (symbol.broker === BROKER_GENERAL_TYPE_CC)
            return this._brokers.cc.getCandles(symbolName, from, until, granularity, count, onData, onDone);
        else if (symbol.broker === BROKER_GENERAL_TYPE_OANDA)
            return this._brokers.oanda.getCandles(symbolName, from, until, granularity, count, onData, onDone);
        else
            throw new Error('UNKOWN BROKER: ' + JSON.stringify(symbol, null, 2));
    }

    public openTickStream(symbols: Array<string>): void {
        const brokers = this.splitSymbolsToBrokers(symbols);

        this._brokers.oanda.on('tick', tick => this.emit('tick', tick));
        this._brokers.oanda.subscribePriceStream(brokers.oanda);

        this._brokers.cc.on('tick', tick => this.emit('tick', tick));
        this._brokers.cc.subscribePriceStream(brokers.cc);
    }

    public splitSymbolsToBrokers(symbols: Array<string>): { oanda: Array<string>, cc: Array<string> } {
        const oanda = [];
        const cc = [];

        symbols.forEach(symbol => {
            let symbolObj = this.symbols.find(s => s.name === symbol);
            if (!symbolObj)
                return;

            if (symbolObj.broker === BROKER_GENERAL_TYPE_CC)
                cc.push(symbol);
            else
                oanda.push(symbol);
        });

        return {
            oanda,
            cc
        }
    }

    private _installBrokerIb() {
        const ib = new IB({
            // clientId: 0,
            // host: '127.0.0.1',
            port: 7497
        })
            .on('error', function (err) {
                console.error('error --- %s', err.message);
            })
            .on('result', function (event, args) {
                // console.log('%s --- %s', event, JSON.stringify(args));
            })
            .once('nextValidId', function (orderId) {
                // ib.placeOrder(
                // 	orderId,
                // 	ib.contract.stock('AAPL'),
                // 	ib.order.limit('BUY', 1, 0.01)  // safe, unreal value used for demo
                // );
                ib.reqScannerParameters();
                ib.reqOpenOrders();
                ib.reqHistoricalData(4001, ib.contract.forex('EUR', 'USD'), '20170408 12:00:00', '1 M', '1 day', 'TRADES', 1, 1, false);
            })
            .on('scannerParameters', data => {
                var json = parser.toJson(data, { object: true });
                fs.writeFileSync('temp.json', JSON.stringify(json.ScanParameterResponse, null, 2));
            })
            .on('historicalData', (reqId, data) => {
                console.log(data);
                var json = parser.toJson(data, { object: true });
                fs.writeFileSync('temp.json', JSON.stringify(json.ScanParameterResponse, null, 2));
            })
            .once('openOrderEnd', function () {
                // ib.disconnect();
            });

        ib.connect().reqIds(1);

        this._brokers.ib = ib;
    }

    private _installBrokerOanda() {
        this._brokers.oanda = new OandaApi(config.broker.oanda);
        this._brokers.oanda.init();
    }

    private _installBrokerCC() {
        this._brokers.cc = new CyrptoCompareApi({});
    }

    destroy() {

    }
}