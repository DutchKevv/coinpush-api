import { EventEmitter } from 'events';
import { log } from '../util/util.log';
import { OandaApi} from './oanda/index';
import CyrptoCompareApi from './cc/cryptocompare.broker';
import { BROKER_GENERAL_TYPE_CC, BROKER_GENERAL_TYPE_OANDA, BROKER_GENERAL_TYPE_IEX } from '../constant/constants';
import IEXApi from './iex/iex';
import { config } from '../util/util-config';

export class BrokerMiddleware extends EventEmitter {

    private _symbols: Array<any> = [];

    get symbols() {
        return this._symbols;
    }

    constructor() {
        super();

        // this._installBrokerOanda();
        this._installBrokerCC();
        this._installBrokerIEX();
    }

    private _brokers: { oanda: OandaApi, cc: CyrptoCompareApi, iex: IEXApi} = {
        oanda: null,
        cc: null,
        iex: null
    }

    public async getSymbols(): Promise<Array<any>> {
        const results = await Promise.all([this._brokers.cc.getSymbols()]);
        
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
                log.warn('symbol not found for priceObj: ' + priceObj);
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
            log.warn('Unkown symbol: ' + symbolName);
            return Promise.resolve([]);
        }

        if (symbol.broker === BROKER_GENERAL_TYPE_CC)
            return this._brokers.cc.getCandles(symbolName, timeFrame, from, until, count, onData);

        if (symbol.broker === BROKER_GENERAL_TYPE_OANDA)
            return this._brokers.oanda.getCandles(symbolName, timeFrame, from, until, count, onData);

        throw new Error('UNKOWN BROKER: ' + JSON.stringify(symbol, null, 2));
    }

    public openTickStream(brokerNames: Array<string> = ['oanda', 'cc', 'iex']): void {
        
        const brokerSymbols = this.splitSymbolsToBrokers(this.symbols);
        
        if (brokerNames.includes('oanda')) {
            this._brokers.oanda.on('tick', tick => this.emit('tick', tick));
            this._brokers.oanda.subscribePriceStream(brokerSymbols.oanda);
            log.info('BrokerMiddleware', 'oanda tick streams active');
        }

        if (brokerNames.includes('cc')) {
            this._brokers.cc.on('tick', tick => this.emit('tick', tick));
            this._brokers.cc.subscribePriceStream(brokerSymbols.cc);
            log.info('BrokerMiddleware', 'cryptocompare tick streams active');
        }

        if (brokerNames.includes('iex')) {
            this._brokers.iex.on('tick', tick => this.emit('tick', tick));
            this._brokers.iex.subscribePriceStream(brokerSymbols.iex);
            log.info('BrokerMiddleware', 'iex tick streams active');
        }
    }

    public getSymbolsByBroker(broker: number) {
        return this.symbols.filter(symbol => symbol.broker === broker);
    }

    public splitSymbolsToBrokers(symbols: Array<any>): { oanda: Array<string>, cc: Array<string> , iex: Array<string>} {
        return {
            oanda: symbols.filter(symbol => symbol.broker === BROKER_GENERAL_TYPE_OANDA),
            cc: symbols.filter(symbol => symbol.broker === BROKER_GENERAL_TYPE_CC),
            iex: symbols.filter(symbol => symbol.broker === BROKER_GENERAL_TYPE_IEX)
        }
    }

    private _installBrokerOanda() {
        if (this._brokers.oanda) {
            try {
                this._brokers.oanda.destroy();
            } catch (error) {
                log.error(error);
            }
        }

        this._brokers.oanda = new OandaApi(config.brokers.oanda);
        this._brokers.oanda.init();
    }

    private _installBrokerCC() {
        this._brokers.cc = new CyrptoCompareApi({});
    }

    private _installBrokerIEX() {
        this._brokers.iex = new IEXApi({});
    }

    destroy() {

    }
}