import { EventEmitter } from 'events';
import { log } from '../util/util.log';
import OandaApi from './oanda/index';
import CyrptoCompareApi from './cc/cryptocompare.broker';
import { BROKER_GENERAL_TYPE_CC, BROKER_GENERAL_TYPE_OANDA } from '../constant';

const config = require('../../tradejs.config');

export class BrokerMiddleware extends EventEmitter {

    private _symbols: Array<any> = [];

    get symbols() {
        return this._symbols;
    }

    constructor() {
        super();

        this._installBrokerOanda();
        this._installBrokerCC();
    }

    private _brokers: { oanda: OandaApi, cc: CyrptoCompareApi } = {
        oanda: null,
        cc: null
    }

    public async getSymbols(): Promise<Array<any>> {
        const results = await Promise.all([this._brokers.oanda.getSymbols(), this._brokers.cc.getSymbols()]);
        
        const sorted = [].concat(...results).sort((a, b) => {
            return a.displayName.localeCompare(b.displayName);
        });

        // add marker placeholders (Hour / Day)
        sorted.forEach(symbol => {
            symbol.marks = {
                H: undefined,
                D: undefined
            }
        });

        return sorted;
    }

    public async setSymbols(): Promise<void> {
        this._symbols = await this.getSymbols();
        // this._symbols = [this._symbols[0]];

        // remove img url (only needed when building spritesheet in client)
        this.symbols.forEach(symbol => {
            delete symbol.img;
        })
    }

    async setLastKnownPrices() {
        const prices = await this.getCurrentPrices(this.symbols.map(symbol => symbol.name));

        prices.forEach(priceObj => {
            const symbol = this.symbols.find(symbol => symbol.name === priceObj.instrument);

            if (symbol)
                symbol.bid = priceObj.bid;
            else
                console.warn('symbol not found for priceObj: ' + priceObj);
        });
    }

    public async getCurrentPrices(symbols: Array<any>): Promise<Array<any>> {
        const brokers = this.splitSymbolsToBrokers(symbols);
        const pList = [];

        if (brokers.oanda.length)
            pList.push(this._brokers.oanda.getCurrentPrices(brokers.oanda));

        if (brokers.cc.length)
            pList.push(this._brokers.cc.getCurrentPrices(brokers.cc));

        const result = [].concat(...(await Promise.all(pList)));

        return result;
    }

    public getCandles(symbolName, from, until, timeFrame, count, onData): Promise<any> {
        const symbol = this.symbols.find(symbol => symbol.name === symbolName);

        if (!symbol) {
            console.warn('Unkown symbol: ' + symbolName);
            return Promise.resolve([]);
        }

        if (symbol.broker === BROKER_GENERAL_TYPE_CC)
            return this._brokers.cc.getCandles(symbolName, timeFrame, from, until, count, onData);

        if (symbol.broker === BROKER_GENERAL_TYPE_OANDA)
            return this._brokers.oanda.getCandles(symbolName, timeFrame, from, until, count, onData);

        throw new Error('UNKOWN BROKER: ' + JSON.stringify(symbol, null, 2));
    }

    public openTickStream(symbols: Array<string> = this.symbols, brokerNames: Array<string> = []): void {
        const brokers = this.splitSymbolsToBrokers(symbols);

        if (!brokerNames.length || brokerNames.indexOf('oanda') > -1) {
            this._brokers.oanda.on('tick', tick => this.emit('tick', tick));
            this._brokers.oanda.subscribePriceStream(brokers.oanda);
            log.info('Cache', 'oanda tick streams active');
        }

        if (!brokerNames.length || brokerNames.indexOf('cc') > -1) {
            this._brokers.cc.on('tick', tick => this.emit('tick', tick));
            this._brokers.cc.subscribePriceStream(brokers.cc);
            log.info('Cache', 'cryptocompare tick streams active');
        }
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

    private _installBrokerOanda() {
        if (this._brokers.oanda) {
            try {
                this._brokers.oanda.destroy();
            } catch (error) {
                console.error(error);
            }
        }

        this._brokers.oanda = new OandaApi(config.broker.oanda);

        // handle tick stream timeout (the used oanda file does not reconnect for some reason)
        this._brokers.oanda.once('stream-timeout', () => {
            this._installBrokerOanda();
            this.openTickStream(this.symbols, ['oanda'])
        });

        this._brokers.oanda.init();
    }

    private _installBrokerCC() {
        this._brokers.cc = new CyrptoCompareApi({});
    }

    destroy() {

    }
}