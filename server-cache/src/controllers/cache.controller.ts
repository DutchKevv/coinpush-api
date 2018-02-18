import * as path from 'path';
import { log } from '../../../shared/logger';
import OandaApi from '../../../shared/brokers/oanda';
import { dataLayer } from './cache.datalayer';
import { symbolController } from './symbol.controller';
import { app } from '../app';
import { Status } from '../schemas/status.schema';
import { BROKER_GENERAL_TYPE_CC, BROKER_GENERAL_TYPE_OANDA } from '../../../shared/constants/constants';
import { timeFrameSteps } from '../../../shared/util/util.date';
import * as ProgressBar from 'progress';
import * as moment from 'moment-timezone';
import { pubClient } from '../modules/redis';

const config = require('../../../tradejs.config');

const HISTORY_COUNT_DEFAULT = 2000;

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
	find(params: { symbol: string, timeFrame: string, from?: number, until?: number, count?: number, toArray?: boolean }): Promise<Float64Array | NodeBuffer> {
		return dataLayer.read(params);
	},

	/**
	 * fetch candles from corresponding broker
	 * this will also write to DB
	 * @param params 
	 * @param emitStatus 
	 */
	async fetch(params: { symbol: string, timeFrame: string, from: number, until: number, count: number }, emitStatus?: boolean): Promise<void | any> {

		await app.broker.getCandles(params.symbol, params.from, params.until, params.timeFrame, params.count, async (candles: Float64Array) => {

			// Store candles in DB, wait until finished before continueing to the next, 
			// prevents 'holes' in data when 1 failed in between
			// TODO: Better way? This makes it slow
			await dataLayer.write(params.symbol, params.timeFrame, candles);

		});
	},

	/**
	 * callback function for when a tick is received
	 * for now the ticks 'overwrite' them self every N miliseconds, because there can be 25.000 ticks p/s
	 * this will overload the system
	 * @param tick 
	 */
	onTick(tick: any): void {
		let symbolObj = app.broker.symbols.find(symbol => symbol.name === tick.instrument);

		if (!symbolObj)
			return console.warn('onTickReceive - symbol not found: ' + tick.instrument);

		this.tickBuffer[tick.instrument] = [tick.time, tick.bid, tick.ask];

		symbolObj.bid = tick.bid;
		symbolObj.ask = tick.ask;
		symbolObj.lastTick = tick.time;
	},

	/**
	 * sync all symbols with there corresponding brokers.
	 * it will create (if not exists) the DB collections for each symbol
	 * and for every timeFrame (collection) fetch the (missing) candles required to set a minimum number until now (Date.now)
	 * TODO: Refactor so sync can run continuesly without setInterval
	 * @param silent 
	 */
	async sync(silent: boolean = true): Promise<void> {
		const timeFrames = Object.keys(timeFrameSteps);
		let now = Date.now();
		let progressBar;

		// create collections for all symbols
		await dataLayer.createCollections(app.broker.symbols);

		// get all collection statuses
		let statuses = <Array<any>>await Status.find({ timeFrame: { $in: timeFrames } }).lean();

		// progress bar
		if (!silent) {
			progressBar = new ProgressBar(`Syncing [:total] collections | [:bar] :rate/ps :percent :etas`, {
				complete: '=',
				incomplete: ' ',
				width: 30,
				total: statuses.length
			});
		}

		const results = await Promise.all([
			this._syncByStatuses(statuses.filter(status => status.broker === BROKER_GENERAL_TYPE_OANDA), progressBar),
			this._syncByStatuses(statuses.filter(status => status.broker === BROKER_GENERAL_TYPE_CC), progressBar),
		]);

		log.info('cache', `syncing took ${Date.now() - now}ms (oanda: ${results[0].time - now}ms | CC: ${results[1].time - now}ms)`);

		// destroy? progress bar
		progressBar = null;
	},

	/**
	 * loop over statuses and sync symbols
	 * this method exists so each broker can call this method in parrallel
	 * @param statuses 
	 * @param progressBar 
	 */
	async _syncByStatuses(statuses: Array<any>, progressBar?: ProgressBar): Promise<{ time: Number }> {
		if (!statuses.length)
			return;

		const now = Date.now();
		// TODO: get broker names from somewhere else then hardcoded (constants?)
		const brokerName = statuses[0].broker === BROKER_GENERAL_TYPE_CC ? 'CryptoCompare' : 'Oanda';
		log.info('cache', `syncing ${statuses.length} collections for broker ${brokerName}`);

		// loop over each symbol (in bulk)
		// for (let i = 0, len = statuses.length; i < len; i++) {
		statuses.forEach(async (status, i) => {
			const now = Date.now();
			// const status = statuses[i];

			let lastSyncTimestamp;

			// log.info('cache', 'syncing: ' + brokerName + ' |  ' + i);

			// only continue if a new bar is there
			if (status.lastSync) {
				lastSyncTimestamp = (new Date(status.lastSync)).getTime();

				if (lastSyncTimestamp + timeFrameSteps[status.timeFrame] > now) {
					progressBar && progressBar.tick();
					// continue;
					return;
				}
			}

			// the fetch promise, catches errors so the entire loop will not break if one fails
			try {
				await this.fetch({
					symbol: status.symbol,
					timeFrame: status.timeFrame,
					from: lastSyncTimestamp || undefined,
					count: status.lastSync ? undefined : HISTORY_COUNT_DEFAULT
				});

				await symbolController.updateSymbol(status.symbol);

				pubClient.HMSET('symbols', {
					[status.symbol]: JSON.stringify(app.broker.symbols.find(symbol => symbol.name === status.symbol))
				});
			} catch (error) {
				console.error(error);
			} finally {
				progressBar && progressBar.tick();
			}
		// }
		});

		return {
			time: Date.now()
		}
	}
};