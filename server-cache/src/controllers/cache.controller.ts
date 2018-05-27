import { log } from 'coinpush/util/util.log';
import { dataLayer } from './cache.datalayer';
import { symbolController } from './symbol.controller';
import { app } from '../app';
import { Status } from '../schemas/status.schema';
import { BROKER_GENERAL_TYPE_CC, BROKER_GENERAL_TYPE_OANDA } from 'coinpush/constant';
import { timeFrameSteps } from 'coinpush/util/util.date';
import { pubClient } from 'coinpush/redis';

const config = require('../../../tradejs.config.js');

const HISTORY_COUNT_DEFAULT = 400;

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
	find(params: { symbol: string, timeFrame: string, from?: number, until?: number, count?: number, toArray?: boolean }): Promise<any> {
		// return Promise.resolve([]);
		return dataLayer.read(params);
	},

	/**
	 * fetch candles from corresponding broker
	 * this will also write to DB
	 * @param params 
	 * @param emitStatus 
	 */
	async fetch(params: { symbol: string, timeFrame: string, from: number, until: number, count: number }, emitStatus?: boolean): Promise<void | any> {

		await app.broker.getCandles(params.symbol, params.from, params.until, params.timeFrame, params.count, async (candles: Array<any>) => {

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
			return log.warn('onTickReceive - symbol not found: ' + tick.instrument);

		this.tickBuffer[tick.instrument] = [tick.time, tick.bid, tick.ask];
		
		if (symbolObj.name === 'BTS') {
			console.log('ONTICK', tick);
		}

		symbolObj.bid = tick.bid;
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

		// create collections for all symbols
		await dataLayer.createCollections(app.broker.symbols);

		// get all collection statuses
		let statuses = <Array<any>>await Status.find().lean();
		// let statuses = <Array<any>>await Status.find({ timeFrame: { $in: timeFrames } }).lean();

		const results = await Promise.all([
			// this._syncByStatuses([statuses.filter(status => status.broker === BROKER_GENERAL_TYPE_OANDA)[0]]), // grab only 1 (for dev)
			this._syncByStatuses(statuses.filter(status => status.broker === BROKER_GENERAL_TYPE_OANDA)),
			// this._syncByStatuses([statuses.filter(status => status.broker === BROKER_GENERAL_TYPE_CC)[0]]), // grab only 1 (for dev)
			// this._syncByStatuses(statuses.filter(status => status.broker === BROKER_GENERAL_TYPE_CC && status.symbol === 'KNC')), // grab only 1 (for dev)
			this._syncByStatuses(statuses.filter(status => status.broker === BROKER_GENERAL_TYPE_CC)),
		]);

		log.info('cache', `syncing took ${Date.now() - now}ms (oanda: ${results[0].time - now}ms | CC: ${results[1].time - now}ms)`);
	},

	/**
	 * loop over statuses and sync symbols
	 * this method exists so each broker can call this method in parrallel
	 * @param statuses 
	 */
	async _syncByStatuses(statuses: Array<any>): Promise<{ time: Number }> {
		if (!statuses.length)
			return;

		const now = Date.now();
		// TODO: get broker names from somewhere else then hardcoded (constants?)
		const brokerName = statuses[0].broker === BROKER_GENERAL_TYPE_CC ? 'CryptoCompare' : 'Oanda';
		
		log.info('cache', `syncing ${statuses.length} collections for broker ${brokerName}`);

		// loop over each symbol
		for (let i = 0, len = statuses.length; i < len; i++) {
			const now = Date.now();
			const status = statuses[i];

			let lastSyncTimestamp;

			for (let timeFrameKey in status.timeFrames) {
				const timeFrameObj = status.timeFrames[timeFrameKey];

				// log.info('cache', `syncing ${status.symbol}: ` + brokerName + ' |  ' + i);

				// only continue if a new bar is there
				if (timeFrameObj.lastSync) {
					lastSyncTimestamp = (new Date(timeFrameObj.lastSync)).getTime();

					if (lastSyncTimestamp + timeFrameSteps[timeFrameKey] > now) {
						continue;
					}
				}

				try {
					await this.fetch({
						symbol: status.symbol,
						timeFrame: timeFrameKey,
						from: lastSyncTimestamp || undefined,
						count: status.lastSync ? undefined : HISTORY_COUNT_DEFAULT
					});
				} catch (error) {
					log.error(error);
				}
			}

			await symbolController.updateSymbol(status.symbol);

			pubClient.HMSET('symbols', {
				[status.symbol]: JSON.stringify(app.broker.symbols.find(symbol => symbol.name === status.symbol))
			});
		}

		return {
			time: Date.now()
		}
	}
};