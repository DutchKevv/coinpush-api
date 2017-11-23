import * as fs from 'fs';
import * as path from 'path';
import * as redis from '../modules/redis';
import OandaApi from "../../../shared/brokers/oanda/index";
import {cacheController} from './cache.controller';
import {Status} from '../schemas/status.schema';
import {log} from "../../../shared/logger";
import {dataLayer} from "./cache.datalayer";
import {SYMBOL_CAT_TYPE_OTHER} from "../../../shared/constants/constants";
import {app} from '../app';

const metaData = require('../../../shared/brokers/oanda/symbols-meta').meta;

export const symbolController = {

	symbols: [],

	async setList(): Promise<void> {
		let symbolList = await app.broker.getSymbols();

		let currentPrices = await app.broker.getCurrentPrices(symbolList.map(symbol => symbol.name));

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

	update24HourStartPrice() {
		const now = new Date();
		now.setHours(0);
		now.setMinutes(0);
		now.setSeconds(0);
		now.setMilliseconds(0);

		this.symbols.forEach(async symbol => {
			const result = await cacheController.find({symbol: symbol.name, timeFrame: 'M1', until: now.getTime(), count: 1});
			console.log(result.length, new Float64Array(result.buffer, 0, result.length));
		});
	},

	_getMetaFile() {
		fs.readFileSync('');
	},

	_updateRedis(symbols) {
		symbols.forEach(symbol => redis.client.set(`symbol-${symbol.name}`, JSON.stringify(symbol)));
	},
};