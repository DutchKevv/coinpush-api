"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const util_log_1 = require("../util/util.log");
const index_1 = require("./oanda/index");
const cryptocompare_broker_1 = require("./cc/cryptocompare.broker");
const constants_1 = require("../constant/constants");
const iex_1 = require("./iex/iex");
const util_config_1 = require("../util/util-config");
class BrokerMiddleware extends events_1.EventEmitter {
    constructor() {
        super();
        this._symbols = [];
        this._brokers = {
            oanda: null,
            cc: null,
            iex: null
        };
        this._installBrokerOanda();
        this._installBrokerCC();
        this._installBrokerIEX();
    }
    get symbols() {
        return this._symbols;
    }
    async getSymbols() {
        const results = await Promise.all([this._brokers.cc.getSymbols()]);
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
                util_log_1.log.warn('symbol not found for priceObj: ' + priceObj);
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
            util_log_1.log.warn('Unkown symbol: ' + symbolName);
            return Promise.resolve([]);
        }
        if (symbol.broker === constants_1.BROKER_GENERAL_TYPE_CC)
            return this._brokers.cc.getCandles(symbolName, timeFrame, from, until, count, onData);
        if (symbol.broker === constants_1.BROKER_GENERAL_TYPE_OANDA)
            return this._brokers.oanda.getCandles(symbolName, timeFrame, from, until, count, onData);
        throw new Error('UNKOWN BROKER: ' + JSON.stringify(symbol, null, 2));
    }
    openTickStream(brokerNames = ['oanda', 'cc', 'iex']) {
        const brokerSymbols = this.splitSymbolsToBrokers(this.symbols);
        if (brokerNames.includes('oanda')) {
            this._brokers.oanda.on('tick', tick => this.emit('tick', tick));
            this._brokers.oanda.subscribePriceStream(brokerSymbols.oanda);
            util_log_1.log.info('BrokerMiddleware', 'oanda tick streams active');
        }
        if (brokerNames.includes('cc')) {
            this._brokers.cc.on('tick', tick => this.emit('tick', tick));
            this._brokers.cc.subscribePriceStream(brokerSymbols.cc);
            util_log_1.log.info('BrokerMiddleware', 'cryptocompare tick streams active');
        }
        if (brokerNames.includes('iex')) {
            this._brokers.iex.on('tick', tick => this.emit('tick', tick));
            this._brokers.iex.subscribePriceStream(brokerSymbols.iex);
            util_log_1.log.info('BrokerMiddleware', 'iex tick streams active');
        }
    }
    getSymbolsByBroker(broker) {
        return this.symbols.filter(symbol => symbol.broker === broker);
    }
    splitSymbolsToBrokers(symbols) {
        return {
            oanda: symbols.filter(symbol => symbol.broker === constants_1.BROKER_GENERAL_TYPE_OANDA),
            cc: symbols.filter(symbol => symbol.broker === constants_1.BROKER_GENERAL_TYPE_CC),
            iex: symbols.filter(symbol => symbol.broker === constants_1.BROKER_GENERAL_TYPE_IEX)
        };
    }
    _installBrokerOanda() {
        if (this._brokers.oanda) {
            try {
                this._brokers.oanda.destroy();
            }
            catch (error) {
                util_log_1.log.error(error);
            }
        }
        this._brokers.oanda = new index_1.OandaApi(util_config_1.config.brokers.oanda);
        this._brokers.oanda.init();
    }
    _installBrokerCC() {
        this._brokers.cc = new cryptocompare_broker_1.default({});
    }
    _installBrokerIEX() {
        this._brokers.iex = new iex_1.default({});
    }
    destroy() {
    }
}
exports.BrokerMiddleware = BrokerMiddleware;
