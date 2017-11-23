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

	async find(params: { symbol: string, timeFrame: string, from?: number, until?: number, count?: number }) {
		let symbol = params.symbol,
			timeFrame = params.timeFrame,
			from = params.from,
			until = params.until,
			count = params.count,
			candles = null;
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
			

		return await dataLayer.read(params);
	},

	async fetch(params: { symbol: string, timeFrame: string, from: number, until: number, count: number }, emitStatus?: boolean): Promise<void> {

		this._fetchQueue = this._fetchQueue.then(async () => {
			let symbol = params.symbol,
				timeFrame = params.timeFrame,
				from = params.from,
				until = params.until,
				count = params.count;

			if (count && from && until)
				throw new Error('Cache->fetch : Only from OR until can be given when using count, not both');

			// Get missing chunks
			let chunks = dataMapper.getMissingChunks(symbol, timeFrame, from, until, count),
				done = 0;

			if (!chunks.length)
				return;

			// Fire all missing chunk request
			return Promise.all(chunks.map(chunk => {

				return new Promise((resolve, reject) => {
					let now = Date.now(),
						streamChunkTotal = 0,
						streamChunkWritten = 0,
						endTriggered = false,
						total = 0;

					log.info('Cache', `Fetching ${symbol}/${timeFrame} from ${chunk.from} until ${chunk.until} count ${chunk.count}`);

					app.broker.getCandles(symbol, timeFrame, chunk.from, chunk.until, chunk.count, async (buf: NodeBuffer) => {
						streamChunkTotal++;

						console.log(`WRITING ${(buf.length / 8) / 10} candles to DB`);

						// Store candles in DB
						await dataLayer.write(symbol, timeFrame, buf);

						// Make sure there is a from to store in mapper
						from = from || buf.readDoubleLE(0);

						let c_until = buf.readDoubleLE(buf.length - (10 * Float64Array.BYTES_PER_ELEMENT)),
							c_count = buf.length / (10 * Float64Array.BYTES_PER_ELEMENT);

						total += c_count;

						// Update map every time a chunk is successfully added
						// Use the original from date (if given) as data comes in forwards, this simplifies the mapper updating
						dataMapper.update(symbol, timeFrame, from, c_until || until, c_count);

						streamChunkWritten++;

						// Send trigger for clients
						if (emitStatus) {
							this.ipc.send('main', 'cache:fetch:status', {
								symbol: symbol,
								timeFrame: timeFrame,
								value: dataMapper.getPercentageComplete(symbol, timeFrame, from, until, count)
							});
						}

						if (done === chunks.length && streamChunkWritten === streamChunkTotal)
							resolve();

					}, err => {

						if (err)
							return reject(err);

						// Update the total request
						dataMapper.update(symbol, timeFrame, from, until, total);

						log.info('Cache', `Fetching ${symbol} took ${Date.now() - now} ms`);

						endTriggered = true;

						if (++done === chunks.length && streamChunkWritten === streamChunkTotal)
							resolve();
					});
				});
			}));
		});

		return this._fetchQueue;
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
		this._tickIntervalTimer = setInterval(() => {
			if (!Object.getOwnPropertyNames(this._tickBuffer).length) return;

			app.io.sockets.emit('ticks', this._tickBuffer);

			this._tickBuffer = {};
		}, 200);
	},

	async preLoad() {
		const results = await Promise.all(symbolController.symbols.map(symbol => {
			return this.fetch({ symbol: symbol.name, timeFrame: 'M1', count: 5000 });
		}));

		console.log('done!');
	},

	async _isComplete(symbol, timeFrame, from, until) {
		const status = await Status.findOne({symbol, timeFrame});
		return status.lastSync > until
	},

	_updateRedis(symbols) {
		symbols.forEach(symbol => redis.client.set(`symbol-${symbol.name}`, JSON.stringify(symbol)));
	},

	_onTickReceive(tick): void {
		if (!this._tickBuffer[tick.instrument])
			this._tickBuffer[tick.instrument] = [];

		let symbolObj = this.symbols.find(symbol => symbol.name === tick.instrument);

		symbolObj.bid = tick.bid;
		symbolObj.ask = tick.ask;
		symbolObj.lastTick = tick.time;

		this._updateRedis([symbolObj]);

		this._tickBuffer[tick.instrument].push([tick.time, tick.bid, tick.ask]);
	}
};