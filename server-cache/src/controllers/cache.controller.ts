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
import { BROKER_GENERAL_TYPE_CC, BROKER_GENERAL_TYPE_OANDA } from '../../../shared/constants/constants';
import { timeFrameSteps } from '../../../shared/util/util.date';
import * as ProgressBar from 'progress';
import * as moment from 'moment-timezone';
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
		const timeFrames = Object.keys(timeFrameSteps);
		let progressBar, statuses;

		// create collections for all symbols
		await dataLayer.createCollections(app.broker.symbols);

		// get all collection statuses
		statuses = <Array<any>>await Status.find({ timeFrame: { $in: timeFrames } }).lean();

		// progress bar
		if (!silent) {
			progressBar = new ProgressBar(`syncing ${statuses.length} symbols [:bar] :rate/ps :percent :etas`, {
				complete: '=',
				incomplete: ' ',
				width: 30,
				total: statuses.length
			});
		}

		await Promise.all([
			this._syncByStatuses(statuses.filter(status => status.broker === BROKER_GENERAL_TYPE_CC), progressBar),
			this._syncByStatuses(statuses.filter(status => status.broker === BROKER_GENERAL_TYPE_OANDA), progressBar),
		]);

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

	async _syncByStatuses(statuses: Array<any>, progressBar?: ProgressBar): Promise<void> {
		if (!statuses.length)
			return;

		log.info('cache', `updating ${statuses.length} collections for broker ${statuses[0].broker}`);

		const bulkCount = 10;

		// loop over each symbol (in bulk)
		for (let i = 0, len = statuses.length; i < len; i += bulkCount) {
			const now = moment().tz('Europe/London');

			// create multi promise of bulk
			const pMultiList = statuses.slice(i, i + bulkCount).map(status => {
				let lastSyncTimestamp;
				
				// only continue if a new bar is there
				if (status.lastSync) {
					lastSyncTimestamp = moment(status.lastSync).tz('Europe/London');

					if (status.lastSync.getTime() + timeFrameSteps[status.timeFrame] <= now) {
						progressBar.tick();
						return;
					}	
				}
					
				// the fetch promise, catches errors so the entire loop will not break if one fails
				return this
					.fetch({ 
						symbol: status.symbol, 
						timeFrame: status.timeFrame, 
						from: lastSyncTimestamp.unix(), 
						count: status.lastSync ? undefined : HISTORY_COUNT_DEFAULT
					})
					.catch(console.error)
					.then(() => progressBar && progressBar.tick());
			});
		
			// flatten & execute
			const result = await Promise.all(pMultiList);
		}		
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