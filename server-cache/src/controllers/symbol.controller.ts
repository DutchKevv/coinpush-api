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
	update() {
		return Promise.all([
			this.updateStartPrices(),
			this.updateHighLowPopular()
		]);
	},

	/**
	 * set start time and price for 1H/24H (percentage) diffs
	 * TODO: only needed after 1H/24 (not every minute)
	 */
	async updateStartPrices() {
		for (let i = 0, len = app.broker.symbols.length; i < len; i++) {
			const symbol = app.broker.symbols[i];

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
		}
	},

	/**
	 * set high lows
	 */
	async updateHighLowPopular() {
		const now = new Date();
		now.setHours(0);
		now.setMinutes(0);
		now.setSeconds(0);
		now.setMilliseconds(0);

		for (let i = 0, len = app.broker.symbols.length; i < len; i++) {
			const symbol = app.broker.symbols[i];

			// find last 24 hours of bars
			const barsAmount = 60 * 24; // 1440 M1 bars
			const candles = await cacheController.find({ symbol: symbol.name, timeFrame: 'M1', count: barsAmount, toArray: true });

			// set high / low of the day
			let high = 0;
			let low = 0;
			let volume = 0;

			for (let i = 0, len = candles.length; i < len; i += 10) {
				let candle = candles[i + 1];

				if (candle > high)
					high = candle;
				if (!low || candle < low)
					low = candle;
			}

			symbol.volume = volume;
			symbol.high = high;
			symbol.low = low;
		}
	},

	/**
	 * set last known prices from DB so 
	 */
	async setLastKnownPrices() {
		for (let i = 0, len = app.broker.symbols.length; i < len; i++) {
			const symbol = app.broker.symbols[i];
			const results = await cacheController.find({ symbol: symbol.name, timeFrame: 'M1', count: 1, toArray: true })

			if (results.length)
				symbol.bid = results[7]
			else
				console.warn('unknown symbol: ' + symbol.displayName);
		}
	}
};