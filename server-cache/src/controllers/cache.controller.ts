import * as path from 'path';
import * as redis from '../modules/redis';

const config = require('../../../tradejs.config');

var offset = new Date().getTimezoneOffset();

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
import { client } from '../modules/redis';

const READ_COUNT_DEFAULT = 2000;
const HISTORY_COUNT_DEFAULT = 2000;

const dataMapper = new CacheMapper({
	path: path.join(__dirname, '..', '..', '_data')
});

export const cacheController = {

	tickBuffer: {},

	_fetchQueue: Promise.resolve(),
	_tickStreamOpen: false,
	_tickIntervalTimer: null,

	/**
	 * find candles by symbol and time frame
	 * can return candles as Float64Array or as raw buffer
	 * @param params 
	 */
	async find(params: { symbol: string, timeFrame: string, from?: number, until?: number, count?: number, toArray?: boolean }): Promise<Float64Array | NodeBuffer> {
		let symbol = params.symbol,
			timeFrame = params.timeFrame,
			from = params.from,
			until = params.until,
			count = params.count;

		if (!symbol || typeof symbol !== 'string')
			throw new Error('Cache -> Read : No symbol given');

		if (!timeFrame || typeof timeFrame !== 'string')
			throw new Error('Cache -> Read : No timeFrame given');

		// if (count && from && until)
		// 	throw new Error('Cache -> Read : Only from OR until can be given when using count, not both');

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

	/**
	 * fetch candles from corresponding broker
	 * this will also write to DB
	 * @param params 
	 * @param emitStatus 
	 */
	async fetch(params: { symbol: string, timeFrame: string, from: number, until: number, count: number }, emitStatus?: boolean): Promise<void | any> {

		return new Promise((resolve, reject) => {

			app.broker.getCandles(params.symbol, params.timeFrame, params.from, params.until, params.count, async (candles: Float64Array) => {

				// Store candles in DB, wait until finished before continueing to the next, 
				// prevents 'holes' in data when 1 failed in between
				// TODO: Better way? This makes it slow
				await dataLayer.write(params.symbol, params.timeFrame, candles);

			}, err => {
				if (err)
					return reject(err);

				resolve();
			});
		});
	},

	/**
	 * start listening to ticks from all brokers
	 */
	async openTickStream(): Promise<void> {
		app.broker.removeAllListeners('tick');

		await app.broker.openTickStream(app.broker.symbols.map(symbol => symbol.name));

		app.broker.on('tick', tick => this._onTickReceive(tick));
		this._tickStreamOpen = true;
		dataMapper.streamOpenSince = Date.now();

		log.info('Cache', 'Tick stream opened');
	},

	/**
	 * sync all symbols with there corresponding brokers.
	 * it will create (if not exists) the DB collections for each symbol
	 * and for every timeFrame (collection) fetch the (missing) candles required to set a minimum number until now (Date.now)
	 * @param silent 
	 */
	async sync(silent: boolean = true): Promise<void> {
		const now = Date.now();
		const bulkCount = 10;
		const timeFrames = Object.keys(timeFrameSteps);
		let progressBar, statuses = [];

		// create collections for all symbols
		await dataLayer.createCollections(app.broker.symbols);

		// get all collection statuses
		const rawStatuses = <Array<any>>await Status.find({ timeFrame: { $in: timeFrames } }, { symbol: 1, lastSync: 1, timeFrame: 1 }).lean();

		rawStatuses.forEach(status => {
			const lastSyncTimestamp = new Date(status.lastSync).getTime();

			// only continue if a new bar is there
			if (!lastSyncTimestamp || lastSyncTimestamp + timeFrameSteps[status.timeFrame] <= now) {
				status.lastSyncTimestamp = lastSyncTimestamp || undefined; // remove NaN
				statuses.push(status);
			}
		});

		// progress bar
		if (!silent) {
			progressBar = new ProgressBar(`syncing ${statuses.length} symbols [:bar] :rate/ps :percent :etas`, {
				complete: '=',
				incomplete: ' ',
				width: 30,
				total: statuses.length
			});
		}

		log.info('cache', `updating ${statuses.length} collections`);

		// loop over each symbol (in bulk)
		for (let i = 0, len = app.broker.symbols.length; i < len; i += bulkCount) {

			// create bulk of symbols
			const symbols = app.broker.symbols.slice(i, i + bulkCount);

			// create multi promise of bulk
			const pMultiList = symbols.map(symbol => {

				// get every status that belongs to current symbol
				const statusArr = statuses.filter(status => status.symbol === symbol.name);

				const pMultiSubList = [];
				const now = Date.now();

				// for every status (symbol + time frame) create multiple fetch promises
				statusArr.forEach(status => {
					const from = status.lastSyncTimestamp;
					const until = Date.now();
					const count = status.lastSync ? Math.ceil((until - from) / timeFrameSteps[status.timeFrame]) : HISTORY_COUNT_DEFAULT;

					// the fetch promise, catches errors so the entire loop will not break if one fails
					const p = this
						.fetch({ symbol: symbol.name, timeFrame: status.timeFrame, from, until, count })
						.catch(console.error)
						.then(() => progressBar && progressBar.tick());

					pMultiSubList.push(p);
				});

				return pMultiSubList;
			});

			// flatten & execute
			const result = await Promise.all([].concat(...pMultiList));
		}

		// set last known price on symbols
		// TODO: should be done while fetching / writing or in the tick stream
		statuses = await Status.find({ symbol: { $in: app.broker.symbols.map(symbol => symbol.name) }, timeFrame: 'M1' }, { lastPrice: 1, symbol: 1 });

		statuses.forEach(status => {
			const symbol = app.broker.symbols.find(symbol => symbol.name === status.symbol);
			if (symbol)
				symbol.bid = status.lastPrice;
		});

		// destroy progress bar
		progressBar = null;

		log.info('cache', `updating collections took ${Date.now() - now}ms`);
	},

	/**
	 * callback function for when a tick is received
	 * for now the ticks 'overwrite' them self every N miliseconds, because there can be 25.000 ticks p/s
	 * this will overload the system
	 * @param tick 
	 */
	_onTickReceive(tick: any): void {
		let symbolObj = app.broker.symbols.find(symbol => symbol.name === tick.instrument);

		if (!symbolObj)
			return console.warn('onTickReceive - symbol not found: ' + tick.instrument);

		this.tickBuffer[tick.instrument] = [tick.time, tick.bid, tick.ask];

		symbolObj.bid = tick.bid;
		symbolObj.ask = tick.ask;
		symbolObj.lastTick = tick.time;
	}
};