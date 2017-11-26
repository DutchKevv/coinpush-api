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

const READ_COUNT_DEFAULT = 500;
const HISTORY_M1_COUNT_DEFAULT = 2000;

/**
 * Broker
 */

const dataMapper = new CacheMapper({
	path: path.join(__dirname, '..', '..', '_data')
});

export const cacheController = {

	symbols: [],

	_tickBuffer: [],
	_fetchQueue: Promise.resolve(),
	_tickStreamOpen: false,
	_tickIntervalTimer: null,

	async find(params: { symbol: string, timeFrame: string, from?: number, until?: number, count?: number, toArray?: boolean }) {
		let symbol = params.symbol,
			timeFrame = params.timeFrame,
			from = params.from,
			until = params.until,
			count = params.count;
		// softUntil;

		log.info('Cache', `Read ${symbol}-${timeFrame} from ${from} until ${until} count ${count}`);

		if (!symbol || typeof symbol !== 'string')
			throw new Error('Cache -> Read : No symbol given');

		if (!timeFrame || typeof timeFrame !== 'string')
			throw new Error('Cache -> Read : No timeFrame given');

		if (count && from && until)
			throw new Error('Cache -> Read : Only from OR until can be given when using count, not both');

		if ((!from && !until))
			until = params.until = Date.now();

		// Make sure there is a count/limit
		count = params.count = params.count || READ_COUNT_DEFAULT;


		// Create a soft until for the isComplete check
		// This is needed to fake updated data status
		// -- Let Mapper think all data from when the tick stream opened until now is complete --
		// softUntil = dataMapper.streamOpenSince && until > dataMapper.streamOpenSince ? dataMapper.streamOpenSince : until;

		// If full dateRange given,
		// Its possible to check if range is complete purely on mapper
		// if (from && until) {
		// 	if (!dataMapper.isComplete(symbol, timeFrame, from, softUntil, count))
		// 		await this.fetch(Object.assign({}, params, { until: softUntil }));
		// }
		// // Count given
		// // First read, then check in mapper if data is complete by first/last candles
		// // Otherwise fetch and read again
		// else {
		// 	candles = await dataLayer.read(params);

		// 	if (candles.length) {
		// 		let first = candles.readDoubleLE(0),
		// 			last = candles.readDoubleLE(candles.length - (10 * Float64Array.BYTES_PER_ELEMENT));

		// 		if (!dataMapper.isComplete(symbol, timeFrame, first, last)) {
		// 			candles = null;
		// 			await this.fetch(Object.assign({}, params, { until: softUntil }));
		// 		}
		// 	} else {
		// 		candles = null;
		// 		await this.fetch(Object.assign({}, params, { until: softUntil }));
		// 	}
		// }

		// if (candles === null)
		// 	candles = await dataLayer.read(params);
		// else if (candles.length / (10 * Float64Array.BYTES_PER_ELEMENT) > params.count) {
		// 	candles.slice(candles.length - ((10 * Float64Array.BYTES_PER_ELEMENT) * params.count));
		// }

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

		await app.broker.openTickStream(this.symbols.map(symbol => symbol.name));

		app.broker.on('tick', tick => this._onTickReceive(tick));
		this._tickStreamOpen = true;
		dataMapper.streamOpenSince = Date.now();

		log.info('Cache', 'Tick stream opened');
	},

	async reset(symbol?: string, timeFrame?: string, from?: number, until?: number): Promise<any> {
		await Promise.all([
			dataMapper.reset(symbol, timeFrame),
			dataLayer.reset()
		]);

		await dataLayer.setModels(this.symbols.map(_symbol => _symbol.name));

		log.info('Cache', 'Reset complete');
	},

	startBroadcastInterval() {
		// this._tickIntervalTimer = setInterval(() => {
		// 	if (!Object.getOwnPropertyNames(this._tickBuffer).length) return;

		// 	app.io.sockets.emit('ticks', this._tickBuffer);

		// 	this._tickBuffer = {};
		// }, 200);
	},

	async preLoad() {
		const statuses = await Status.find({ timeFrame: 'M1' });

		const results = await Promise.all(statuses.map((status, index) => {

			const from = status.lastSync ? (new Date(status.lastSync)).getTime() : undefined;
			const until = Date.now();
			const count = status.lastSync ? undefined : HISTORY_M1_COUNT_DEFAULT;
			console.log('from', from);
			return this.fetch({ symbol: status.symbol, timeFrame: 'M1', from, until, count })
		}));

		console.log('done!');
	},

	async _isComplete(symbol, timeFrame, from, until) {
		const status = await Status.findOne({ symbol, timeFrame });
		return status.lastSync > until
	},

	_updateRedis(symbols) {
		symbols.forEach(symbol => redis.client.set(`symbol-${symbol.name}`, JSON.stringify(symbol)));
	},

	_onTickReceive(tick): void {
		// if (!this._tickBuffer[tick.instrument])
		// 	this._tickBuffer[tick.instrument] = [];

		let symbolObj = this.symbols.find(symbol => symbol.name === tick.instrument);

		symbolObj.bid = tick.bid;
		symbolObj.ask = tick.ask;
		symbolObj.lastTick = tick.time;

		app.io.sockets.emit('ticks', { [tick.instrument]: [[tick.time, tick.bid, tick.ask]] });

		// this._tickBuffer[tick.instrument].push([tick.time, tick.bid, tick.ask]);
	}
};