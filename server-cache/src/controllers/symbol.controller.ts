import * as fs from 'fs';
import * as path from 'path';
import { cacheController } from './cache.controller';
import { dataLayer } from "./cache.datalayer";
import { SYMBOL_CAT_TYPE_OTHER } from "coinpush/constant";
import { app } from '../app';

const metaData = require('coinpush/broker/oanda/symbols-meta').meta;

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
			cacheController.find({ symbol: symbol.name, timeFrame: 'H1', count: 1}), // 1 h
			cacheController.find({ symbol: symbol.name, timeFrame: 'D', count: 1}) // 24 h
		]);

		symbol.marks.H = {
			time: results[0][0][0],
			price: results[0][0][1]
		}

		symbol.marks.D = {
			time: results[1][0][0],
			price: results[1][0][1]
		}
	},

	/**
	 * set high lows and 24h volume
	 */
	async updateHighLowPopular(symbol) {
		const now = new Date();
		now.setHours(0);
		now.setMinutes(0);
		now.setSeconds(0);
		now.setMilliseconds(0);

		// find last 24 hours of bars
		const barsAmount = 60 * 24; // 1440 M1 bars
		const candles = await cacheController.find({ symbol: symbol.name, timeFrame: 'M1', count: barsAmount});

		if (!candles.length)
			return;

		// set high / low of the day
		let high = 0;
		let low = 0;
		let volume = 0;
		let last = candles[0];
		
		for (let i = 0, len = candles.length; i < len; i++) {
			const candle = candles[i];

			let cHigh = candle[2];
			let cLow = candle[3];

			if (typeof candle[5] === 'number') {
				volume += candle[5];
			} else {
				console.log('no volume', candle);
			}
			

			if (cHigh > high)
				high = cHigh;
			if (!low || cLow < low)
				low = cLow;
		}

		// set price if it wasn't known before (closeBid price)
		if (!symbol.bid && candles.length)
			symbol.bid = last[4];

		symbol.volume = volume;
		symbol.highD = high;
		symbol.highM = last[2]; // last candle high
		symbol.lowD = low;
		symbol.lowM = last[3]; // last candle low
	},

	/**
	 * set last known prices from DB so 
	 */
	async setLastKnownPrices() {
		for (let i = 0, len = app.broker.symbols.length; i < len; i++) {
			const symbol = app.broker.symbols[i];

			const results = await cacheController.find({ symbol: symbol.name, timeFrame: 'M1', count: 1})

			if (results.length) {
				symbol.bid = results[0][4];
			} else {
				console.warn('unknown symbol: ' + symbol.displayName);
			}	
		}
	}
};