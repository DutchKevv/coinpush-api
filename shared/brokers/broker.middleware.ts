import * as IB from 'ib';
import * as fs from 'fs';
import * as parser from 'xml2json';
import OandaApi from './oanda/index';
import {EventEmitter} from 'events';

const config = require('../../tradejs.config');

export class BrokerMiddleware extends EventEmitter {

    constructor() {
        super();

        this._installBrokerOanda();
        this._installBrokerIb();
    }

    private _brokers = {
        ib: null,
        oanda: null
    }

    public getSymbols(): Promise<Array<any>> {
       return this._brokers.oanda.getSymbols();
    }

    public getCurrentPrices(symbols: Array<any>): Promise<Array<any>> {
        return this._brokers.oanda.getCurrentPrices(symbols);
    }

    public getCandles(...params) {
        return this._brokers.oanda.getCandles(...params);
    }

    public openTickStream(symbols: Array<string>): void {
        this._brokers.oanda.on('tick', tick => this.emit('tick', tick));
        this._brokers.oanda.subscribePriceStream(symbols);
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
                var json = parser.toJson(data, {object: true});
                fs.writeFileSync('temp.json', JSON.stringify(json.ScanParameterResponse, null, 2));
            })
            .on('historicalData', (reqId, data) => {
                console.log(data);
                var json = parser.toJson(data, {object: true});
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

    destroy() {

    }
}