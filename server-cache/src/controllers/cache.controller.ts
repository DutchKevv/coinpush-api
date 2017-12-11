import * as path from 'path';
import * as redis from '../modules/redis';

const config = require('../../../tradejs.config');

import { log } from '../../../shared/logger';
import OandaApi from '../../../shared/brokers/oanda';
import CacheMapper from '../../../shared/classes/cache/CacheMap';
import { dataLayer } from './cache.datalayer';
import { symbolController } from './symbol.controller';
import { app } from '../app';
import { Status } from '../schemas/status.schema';
import { BROKER_GENERAL_TYPE_CC } from '../../../shared/constants/constants';
import { timeFrameSteps } from '../../../shared/util/util.date';
import * as ProgressBar from 'progress';

const READ_COUNT_DEFAULT = 500;
const HISTORY_COUNT_DEFAULT = 500;

const dataMapper = new CacheMapper({
	path: path.join(__dirname, '..', '..', '_data')
});

export const cacheController = {

	tickBuffer: {},

	_fetchQueue: Promise.resolve(),
	_tickStreamOpen: false,
	_tickIntervalTimer: null,

	async find(params: { symbol: string, timeFrame: string, from?: number, until?: number, count?: number, toArray?: boolean }) {
		let symbol = params.symbol,
			timeFrame = params.timeFrame,
			from = params.from,
			until = params.until,
			count = params.count;

		if (!symbol || typeof symbol !== 'string')
			throw new Error('Cache -> Read : No symbol given');

		if (!timeFrame || typeof timeFrame !== 'string')
			throw new Error('Cache -> Read : No timeFrame given');

		if (count && from && until)
			throw new Error('Cache -> Read : Only from OR until can be given when using count, not both');

		// if ((!from && !until))
		// 	until = params.until = Date.now();

		// Make sure there is a count/limit
		count = params.count = params.count || READ_COUNT_DEFAULT;

		const candles = await dataLayer.read(params);

		if (params.toArray) {
			return new Float64Array(candles.buffer, candles.byteOffset, candles.length / Float64Array.BYTES_PER_ELEMENT);
		} else {
			return candles;
		}
	},

	async fetch(params: { symbol: string, timeFrame: string, from: number, until: number, count: number }, emitStatus?: boolean): Promise<any> {

		return new Promise((resolve, reject) => {

			app.broker.getCandles(params.symbol, params.timeFrame, params.from, params.until, params.count, async (candles: Float64Array) => {

				// Store candles in DB
				await dataLayer.write(params.symbol, params.timeFrame, candles);

			}, err => {
				if (err)
					return reject(err);

				resolve();
			});
		});
	},

	async openTickStream(): Promise<any> {
		app.broker.removeAllListeners('tick');

		await app.broker.openTickStream(app.broker.symbols.map(symbol => symbol.name));

		app.broker.on('tick', tick => this._onTickReceive(tick));
		this._tickStreamOpen = true;
		dataMapper.streamOpenSince = Date.now();

		log.info('Cache', 'Tick stream opened');
	},

	async reset(symbol?: string, timeFrame?: string, from?: number, until?: number): Promise<any> {
		throw new Error('RESETR!!');
	},

	async sync(silent: boolean = true) {
		const now = Date.now();

		// sync all candles in the DB until the current time
		const bulkCount = 10;
		const timeFrames = Object.keys(timeFrameSteps);
		const total = app.broker.symbols.length * timeFrames.length;
		let bar;

		if (!silent) {
			bar = new ProgressBar(`syncing ${total} symbols [:bar] :rate/ps :percent :etas`, {
				complete: '=',
				incomplete: ' ',
				width: 20,
				total
			});
		}

		await dataLayer.setModels(app.broker.symbols);

		let statuses = <Array<any>>await Status.find({ timeFrame: { $in: timeFrames } }, { symbol: 1, lastSync: 1, timeFrame: 1 }).lean();

		for (let i = 0, len = app.broker.symbols.length; i < len; i += bulkCount) {

			// Get a group of symbols
			let symbols = app.broker.symbols.slice(i, i + bulkCount);

			// Create multi promise for each symbol * timeFrames
			let pMultiList = symbols.map(symbol => {

				const statusArr = statuses.filter(status => status.symbol === symbol.name);

				return statusArr.map(status => {
					const from = status.lastSync ? (new Date(status.lastSync)).getTime() : undefined;
					const until = Date.now();
					const count = status.lastSync ? undefined : HISTORY_COUNT_DEFAULT;
					
					return this
						.fetch({ symbol: symbol.name, timeFrame: status.timeFrame, from, until, count })
						.then(() => !silent && bar.tick());
				})

			});

			// Flatten promise list
			let pList = [].concat(...pMultiList);

			await Promise.all(pList);
		}

		// set last price on symbols
		statuses = await Status.find({ timeFrame: 'M1' });
		app.broker.symbols.forEach(symbol => {
			const status = statuses.find(status => status.symbol === symbol.name);

			if (!status)
				return;

			symbol.bid = status.lastPrice;
		});
	},

	_onTickReceive(tick): void {
		this.tickBuffer[tick.instrument] = [tick.time, tick.bid, tick.ask];

		let symbolObj = app.broker.symbols.find(symbol => symbol.name === tick.instrument);

		if (!symbolObj)
			return console.warn('onTickReceive - symbol not found: ' + tick.instrument);

		symbolObj.bid = tick.bid;
		symbolObj.ask = tick.ask;
		symbolObj.lastTick = tick.time;
	}
};