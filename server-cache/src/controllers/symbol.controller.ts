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
		// this.symbols = [(await app.broker.getSymbols())[0]];
		this.symbols = await app.broker.getSymbols();

		let currentPrices = await app.broker.getCurrentPrices(this.symbols.map(symbol => symbol.name));

		this.symbols.forEach(symbol => {
			const price = currentPrices.find(priceObj => priceObj.instrument === symbol.name);
			const meta = metaData.find(m => m.name === symbol.name);

			symbol.bid = price.bid;
			symbol.ask = price.ask;
			symbol.type = meta ? meta.type : SYMBOL_CAT_TYPE_OTHER;
			symbol.favorite = OandaApi.FAVORITE_SYMBOLS.indexOf(symbol.name) > -1;
			
		});

		// this._updateRedis(this.symbols);

		await dataLayer.setModels(this.symbols.map(symbol => symbol.name));
		
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

			// find last 24 hours of bars
			const barsAmount = 60 * 24; // 1440 M1 bars
			const candles = await cacheController.find({symbol: symbol.name, timeFrame: 'M1', until: now.getTime(), count: barsAmount, toArray: true});
		
			const time = candles[0];
			const price = candles[1];
			
			// set timed marks (for changed amount over a day)
			symbol.marks = {
				D: {
					time: time,
					price: price
				}
			};

			// set high and low of the day
			let high = 0;
			let low = 100000000000000;
			for (let i = 0, len = candles.length; i < len; i += 10) {
				let candle = candles[i + 1];

				if (candle > high)
					high = candle;
				if (candle < low)
					low = candle;
			}
			symbol.high = high;
			symbol.low = low;
		});
	},

	_getMetaFile() {
		fs.readFileSync('');
	},

	_updateRedis(symbols) {
		symbols.forEach(symbol => redis.client.set(`symbol-${symbol.name}`, JSON.stringify(symbol)));
	},
};