import * as fs from 'fs';
import * as path from 'path';
import * as redis from '../modules/redis';
import OandaApi from "../../../shared/brokers/oanda/index";
import {log} from "../../../shared/logger";
import {dataLayer} from "./cache.datalayer";
import {SYMBOL_CAT_TYPE_OTHER} from "../../../shared/constants/constants";

const metaData = require('../../../shared/brokers/oanda/symbols-meta').meta;

export const symbolController = {

	symbols: [],
	_brokerApi: null,

	init(brokerApi: OandaApi) {
		this._brokerApi = brokerApi;
	},

	async setList(): Promise<void> {
		let symbolList = await this._brokerApi.getSymbols();

		let currentPrices = await this._brokerApi.getCurrentPrices(symbolList.map(symbol => symbol.name));

		symbolList.forEach(symbol => {
			const price = currentPrices.find(priceObj => priceObj.instrument === symbol.name);
			const meta = metaData.find(m => m.name === symbol.name);

			symbol.bid = price.bid;
			symbol.ask = price.ask;
			symbol.type = meta ? meta.type : SYMBOL_CAT_TYPE_OTHER;
			symbol.favorite = OandaApi.FAVORITE_SYMBOLS.indexOf(symbol.name) > -1;
		});

		this.symbols = symbolList;

		this._updateRedis(this.symbols);

		await dataLayer.setModels(symbolList.map(symbol => symbol.name));

		log.info('Cache', 'Symbol list loaded');

		return Promise.resolve();
	},

	_getMetaFile() {
		fs.readFileSync('');
	},

	_updateRedis(symbols) {
		symbols.forEach(symbol => redis.client.set(`symbol-${symbol.name}`, JSON.stringify(symbol)));
	},
};