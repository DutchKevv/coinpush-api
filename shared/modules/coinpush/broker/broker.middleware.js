"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const util_log_1 = require("../util/util.log");
const index_1 = require("./oanda/index");
const cryptocompare_broker_1 = require("./cc/cryptocompare.broker");
const constant_1 = require("../constant");
const config = require('../../../../tradejs.config');
class BrokerMiddleware extends events_1.EventEmitter {
    constructor() {
        super();
        this._symbols = [];
        this._brokers = {
            oanda: null,
            cc: null
        };
        this._installBrokerOanda();
        this._installBrokerCC();
    }
    get symbols() {
        return this._symbols;
    }
    async getSymbols() {
        const results = await Promise.all([this._brokers.oanda.getSymbols(), this._brokers.cc.getSymbols()]);
        const sorted = [].concat(...results).sort((a, b) => {
            return a.displayName.localeCompare(b.displayName);
        });
        // add marker placeholders (Hour / Day)
        sorted.forEach(symbol => {
            symbol.marks = {
                H: undefined,
                D: undefined
            };
        });
        return sorted;
    }
    async setSymbols() {
        this._symbols = await this.getSymbols();
        // this._symbols = [this._symbols[0]];
        // remove img url (only needed when building spritesheet in client)
        this.symbols.forEach(symbol => {
            delete symbol.img;
        });
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
    async getCurrentPrices(symbols) {
        const brokers = this.splitSymbolsToBrokers(symbols);
        const pList = [];
        if (brokers.oanda.length)
            pList.push(this._brokers.oanda.getCurrentPrices(brokers.oanda));
        if (brokers.cc.length)
            pList.push(this._brokers.cc.getCurrentPrices(brokers.cc));
        const result = [].concat(...(await Promise.all(pList)));
        return result;
    }
    getCandles(symbolName, from, until, timeFrame, count, onData) {
        const symbol = this.symbols.find(symbol => symbol.name === symbolName);
        if (!symbol) {
            console.warn('Unkown symbol: ' + symbolName);
            return Promise.resolve([]);
        }
        if (symbol.broker === constant_1.BROKER_GENERAL_TYPE_CC)
            return this._brokers.cc.getCandles(symbolName, timeFrame, from, until, count, onData);
        if (symbol.broker === constant_1.BROKER_GENERAL_TYPE_OANDA)
            return this._brokers.oanda.getCandles(symbolName, timeFrame, from, until, count, onData);
        throw new Error('UNKOWN BROKER: ' + JSON.stringify(symbol, null, 2));
    }
    openTickStream(symbols = this.symbols, brokerNames = []) {
        const brokers = this.splitSymbolsToBrokers(symbols);
        if (!brokerNames.length || brokerNames.indexOf('oanda') > -1) {
            this._brokers.oanda.on('tick', tick => this.emit('tick', tick));
            this._brokers.oanda.subscribePriceStream(brokers.oanda);
            util_log_1.log.info('Cache', 'oanda tick streams active');
        }
        if (!brokerNames.length || brokerNames.indexOf('cc') > -1) {
            this._brokers.cc.on('tick', tick => this.emit('tick', tick));
            this._brokers.cc.subscribePriceStream(brokers.cc);
            util_log_1.log.info('Cache', 'cryptocompare tick streams active');
        }
    }
    splitSymbolsToBrokers(symbols) {
        const oanda = [];
        const cc = [];
        symbols.forEach(symbol => {
            let symbolObj = this.symbols.find(s => s.name === symbol);
            if (!symbolObj)
                return;
            if (symbolObj.broker === constant_1.BROKER_GENERAL_TYPE_CC)
                cc.push(symbol);
            else
                oanda.push(symbol);
        });
        return {
            oanda,
            cc
        };
    }
    _installBrokerOanda() {
        if (this._brokers.oanda) {
            try {
                this._brokers.oanda.destroy();
            }
            catch (error) {
                console.error(error);
            }
        }
        this._brokers.oanda = new index_1.OandaApi(config.broker.oanda);
        // handle tick stream timeout (the used oanda file does not reconnect for some reason)
        this._brokers.oanda.once('stream-timeout', () => {
            this._installBrokerOanda();
            this.openTickStream(this.symbols, ['oanda']);
        });
        this._brokers.oanda.init();
    }
    _installBrokerCC() {
        this._brokers.cc = new cryptocompare_broker_1.default({});
    }
    destroy() {
    }
}
exports.BrokerMiddleware = BrokerMiddleware;
//# sourceMappingURL=broker.middleware.js.map