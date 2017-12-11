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

export const symbolController = {

	findByName(name: string) {
		return app.broker.symbols.find(symbol => symbol.name === name);
	},

	update() {
		return Promise.all([
			this.update1HourStartPrice(),
			this.update24HourStartPrice(),
			this.updateHighLow()
		]);
	},

	async update1HourStartPrice() {
		app.broker.symbols.forEach(async symbol => {
			const candle = await cacheController.find({ symbol: symbol.name, timeFrame: 'H1', count: 1, toArray: true });

			symbol.marks.H = {
				time: candle[0],
				price: candle[1]
			}
		});
	},

	async update24HourStartPrice() {
		app.broker.symbols.forEach(async symbol => {
			const candle = await cacheController.find({ symbol: symbol.name, timeFrame: 'D', count: 1, toArray: true });

			symbol.marks.D = {
				time: candle[0],
				price: candle[1]
			};
		});
	},

	async updateHighLow() {
		const now = new Date();
		now.setHours(0);
		now.setMinutes(0);
		now.setSeconds(0);
		now.setMilliseconds(0);

		app.broker.symbols.forEach(async symbol => {

			// find last 24 hours of bars
			const barsAmount = 60 * 24; // 1440 M1 bars
			const candles = await cacheController.find({ symbol: symbol.name, timeFrame: 'M1', count: barsAmount, toArray: true });

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
	}
};