import * as path from 'path';
import * as redis from '../modules/redis';

const config = require('../../../tradejs.config');

import {log} from '../../../shared/logger';
import OandaApi from '../../../shared/brokers/oanda';
import CacheMapper from '../../../shared/classes/cache/CacheMap';
import {dataLayer} from './cache.datalayer';

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
	_brokerApi: null,

	async init() {
		await dataMapper.init();
		await this._initBrokerApi();
	},


	async find(params: { symbol: string, timeFrame: string, from: number, until: number, count: number }) {
		let symbol = params.symbol,
			timeFrame = params.timeFrame,
			from = params.from,
			until = params.until,
			count = params.count,
			candles = null,
			softUntil;

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
		softUntil = dataMapper.streamOpenSince && until > dataMapper.streamOpenSince ? dataMapper.streamOpenSince : until;

		// If full dateRange given,
		// Its possible to check if range is complete purely on mapper
		if (from && until) {
			if (!dataMapper.isComplete(symbol, timeFrame, from, softUntil, count))
				await this.fetch(Object.assign({}, params, {until: softUntil}));
		}
		// Count given
		// First read, then check in mapper if data is complete by first/last candles
		// Otherwise fetch and read again
		else {
			candles = await dataLayer.read(params);

			if (candles.length) {
				let first = candles.readDoubleLE(0),
					last = candles.readDoubleLE(candles.length - (10 * Float64Array.BYTES_PER_ELEMENT));

				if (!dataMapper.isComplete(symbol, timeFrame, first, last)) {
					candles = null;
					await this.fetch(Object.assign({}, params, {until: softUntil}));
				}
			} else {
				candles = null;
				await this.fetch(Object.assign({}, params, {until: softUntil}));
			}
		}

		if (candles === null)
			candles = await dataLayer.read(params);

		return candles;
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

					log.info('Cache', `Fetching ${symbol} from ${chunk.from} until ${chunk.until} count ${chunk.count}`);

					this._brokerApi.getCandles(symbol, timeFrame, chunk.from, chunk.until, chunk.count, async (buf: NodeBuffer) => {
						streamChunkTotal++;

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

	async loadAvailableSymbols(): Promise<void> {
		let symbolList = await this._brokerApi.getSymbols();

		let currentPrices = await this._brokerApi.getCurrentPrices(symbolList.map(symbol => symbol.name));

		symbolList.forEach(symbol => {
			let price = currentPrices.find(priceObj => priceObj.instrument === symbol.name);

			symbol.bid = price.bid;
			symbol.ask = price.ask;
			symbol.favorite = OandaApi.FAVORITE_SYMBOLS.indexOf(symbol.name) > -1;
		});

		this.symbols = symbolList;

		this._updateRedis(this.symbols);

		await dataLayer.setModels(symbolList.map(symbol => symbol.name));

		log.info('Cache', 'Symbol list loaded');
	},

	async openTickStream(): Promise<any> {
		this._brokerApi.removeAllListeners('tick');

		await this._brokerApi.subscribePriceStream(this.symbols.map(symbol => symbol.name));

		this._brokerApi.on('tick', tick => this._onTickReceive(tick));
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

	startBroadcastInterval(io) {
		this._tickIntervalTimer = setInterval(() => {
			if (!Object.getOwnPropertyNames(this._tickBuffer).length) return;

			io.sockets.emit('ticks', this._tickBuffer);

			this._tickBuffer = {};
		}, 200);
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
	},

	async _initBrokerApi() {
		await this.destroyBrokerApi();

		this._brokerApi = new OandaApi(config.broker.account);
		this._brokerApi.on('stream-timeout', () => {this._initBrokerApi().catch(console.error)});

		await this._brokerApi.init();
		await this.loadAvailableSymbols();
		await this.openTickStream();
	},

	async destroyBrokerApi(): Promise<boolean> {
		if (!this._brokerApi)
			return;
		
		try {
			this._brokerApi.destroy();
			return true;
		} catch (error) {
			console.error(error);
			return false;
		}
	}
};