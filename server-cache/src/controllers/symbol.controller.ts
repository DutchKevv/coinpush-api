import * as fs from 'fs';
import * as path from 'path';
import * as redis from '../modules/redis';
import OandaApi from "../../../shared/brokers/oanda/index";
import { cacheController } from './cache.controller';
import { Status } from '../schemas/status.schema';
import { log } from "../../../shared/logger";
import { dataLayer } from "./cache.datalayer";
import { SYMBOL_CAT_TYPE_OTHER } from "../../../shared/constants/constants";
import { app } from '../app';

const metaData = require('../../../shared/brokers/oanda/symbols-meta').meta;

/**
 * handle all symbol specific actions that do not concern fetching or writing data
 */
export const symbolController = {

	/**
	 * find symbol by name
	 * @param name 
	 */
	findByName(name: string) {
		return app.broker.symbols.find(symbol => symbol.name === name);
	},

	/**
	 * TODO: refactor to run non-stop
	 */
	updateSymbol(symbolName: string) {
		const symbol = app.broker.symbols.find(symbol => symbol.name === symbolName);

		return Promise.all([
			this.updateStartPrice(symbol),
			this.updateHighLowPopular(symbol)
		]);
	},

	/**
	 * set start time and price for 1H/24H (percentage) diffs
	 * TODO: only needed after 1H/24 (not every minute)
	 */
	async updateStartPrice(symbol) {
		const results = await Promise.all([
			cacheController.find({ symbol: symbol.name, timeFrame: 'H1', count: 1, toArray: true }), // 1 h
			cacheController.find({ symbol: symbol.name, timeFrame: 'D', count: 1, toArray: true }) // 24 h
		]);

		symbol.marks.H = {
			time: results[0][0],
			price: results[0][1]
		}

		symbol.marks.D = {
			time: results[1][0],
			price: results[1][1]
		}
	},

	/**
	 * set high lows
	 */
	async updateHighLowPopular(symbol) {
		const now = new Date();
		now.setHours(0);
		now.setMinutes(0);
		now.setSeconds(0);
		now.setMilliseconds(0);

		// find last 24 hours of bars
		const barsAmount = 60 * 24; // 1440 M1 bars
		const candles = await cacheController.find({ symbol: symbol.name, timeFrame: 'M1', count: barsAmount, toArray: true });

		// set high / low of the day
		let high = 0;
		let low = 0;
		let volume = 0;

		for (let i = 0, len = candles.length; i < len; i += 10) {
			let price = candles[i + 1];
			volume += candles[i + 9];

			if (price > high)
				high = price;
			if (!low || price < low)
				low = price;
		}

		// set price if it wasn't known before (closeBid price)
		if (!symbol.bid && candles.length)
			symbol.bid = candles[candles.length - 3]

		symbol.volume = volume;
		symbol.high = high;
		symbol.low = low;
	},

	/**
	 * set last known prices from DB so 
	 */
	async setLastKnownPrices() {
		for (let i = 0, len = app.broker.symbols.length; i < len; i += 10) {
			const symbol = app.broker.symbols[i];

			const results = await cacheController.find({ symbol: symbol.name, timeFrame: 'M1', count: 1, toArray: true })

			if (results.length)
				symbol.bid = results[1];
			else
				console.warn('unknown symbol: ' + symbol.displayName);
		}
	}
};