import * as path        from 'path';
import * as express     from 'express';
import * as io          from 'socket.io';

import * as mkdirp      from '../../../shared/node_modules/mkdirp';
import {log} 			from '../../../shared/logger';
import OandaApi         from '../../../shared/brokers/oanda';
import CacheMapper      from '../../../shared/classes/cache/CacheMap';
import {AccountSettings} from '../../../shared/interfaces/AccountSettings';
import WorkerChild      from '../worker/WorkerChild';
import CacheDataLayer   from './CacheDataLayer';

export default class Cache extends WorkerChild {

	public static READ_COUNT_DEFAULT = 500;
	public static readonly DEFAULTS: {settings: {account: AccountSettings, path: any}} = <any>{};

	private _brokerApi: OandaApi = null;
	private _dataLayer: CacheDataLayer = null;
	private _mapper: CacheMapper = null;
	private _symbolList: Array<any> = [];
	private _listeners = {};
	private _api: any = null;
	private _http: any = null;
	private _io: any = null;

	private _tickBuffer = {};
	private _tickIntervalTimer = null;
	private _tickStreamOpen = false;

	private _fetchQueue: Promise<any> = Promise.resolve();

	public async init() {
		await super.init();

		// Ensure cache dir exists
		mkdirp.sync(this.options.settings.path.cache);

		this._dataLayer = new CacheDataLayer({path: path.join(this.options.settings.path.cache, 'database.db')});
		this._mapper 	= new CacheMapper({path: this.options.settings.path.cache});

		await Promise.all([
			this._dataLayer.init(),
			this._mapper.init()
		]);

		this._setChannelEvents();
		await this.ipc.startServer();

		this._startBroadcastInterval();

		await this._initApi();
	}

	public async read(params: { symbol: string, timeFrame: string, from: number, until: number, count: number }): Promise<any> {
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
		count = params.count = params.count || Cache.READ_COUNT_DEFAULT;

		// Create a soft until for the isComplete check
		// This is needed to fake updated data status
		// -- Let Mapper think all data from when the tick stream opened until now is complete --
		softUntil = this._mapper.streamOpenSince && until > this._mapper.streamOpenSince ? this._mapper.streamOpenSince : until;

		// If full dateRange given,
		// Its possible to check if range is complete purely on mapper
		if (from && until) {
			if (!this._mapper.isComplete(symbol, timeFrame, from, softUntil, count))
				await this.fetch(Object.assign({}, params, {until: softUntil}));
		}
		// Count given
		// First read, then check in mapper if data is complete by first/last candles
		// Otherwise fetch and read again
		else {
			candles = await this._dataLayer.read(params);

			if (candles.length) {
				let first = candles.readDoubleLE(0),
					last = candles.readDoubleLE(candles.length - (10 * Float64Array.BYTES_PER_ELEMENT));

				if (!this._mapper.isComplete(symbol, timeFrame, first, last)) {
					candles = null;
					await this.fetch(Object.assign({}, params, {until: softUntil}));
				}
			} else {
				candles = null;
				await this.fetch(Object.assign({}, params, {until: softUntil}));
			}
		}

		if (candles === null)
			candles = await this._dataLayer.read(params);

		return candles;
	}

	public async fetch(params: { symbol: string, timeFrame: string, from: number, until: number, count: number }, emitStatus?: boolean): Promise<void> {
		this._fetchQueue = this._fetchQueue.then(async () => {
			let symbol = params.symbol,
				timeFrame = params.timeFrame,
				from = params.from,
				until = params.until,
				count = params.count;

			if (count && from && until)
				throw new Error('Cache->fetch : Only from OR until can be given when using count, not both');

			// Get missing chunks
			let chunks = this._mapper.getMissingChunks(symbol, timeFrame, from, until, count),
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
						await this._dataLayer.write(symbol, timeFrame, buf);

						// Make sure there is a from to store in mapper
						from = from || buf.readDoubleLE(0);

						let c_until = buf.readDoubleLE(buf.length - (10 * Float64Array.BYTES_PER_ELEMENT)),
							c_count = buf.length / (10 * Float64Array.BYTES_PER_ELEMENT);

						total += c_count;

						// Update map every time a chunk is successfully added
						// Use the original from date (if given) as data comes in forwards, this simplifies the mapper updating
						this._mapper.update(symbol, timeFrame, from, c_until || until, c_count);

						streamChunkWritten++;

						// Send trigger for clients
						if (emitStatus) {
							this.ipc.send('main', 'cache:fetch:status', {
								symbol: symbol,
								timeFrame: timeFrame,
								value: this._mapper.getPercentageComplete(symbol, timeFrame, from, until, count)
							});
						}

						if (done === chunks.length && streamChunkWritten === streamChunkTotal)
							resolve();

					}, err => {

						if (err)
							return reject(err);

						// Update the total request
						this._mapper.update(symbol, timeFrame, from, until, total);

						log.info('Cache', `Fetching ${symbol} took ${Date.now() - now} ms`);

						endTriggered = true;

						if (++done === chunks.length && streamChunkWritten === streamChunkTotal)
							resolve();
					});
				});
			}));
		});

		return this._fetchQueue;
	}

	public async reset(symbol?: string, timeFrame?: string, from?: number, until?: number): Promise<any> {
		await Promise.all([
			this._mapper.reset(symbol, timeFrame),
			this._dataLayer.reset()
		]);

		await this._dataLayer.createInstrumentTables(this._symbolList.map(_symbol => _symbol.name));

		log.info('Cache', 'Reset complete');
	}

	private _initApi() {
		return new Promise((resolve, reject) => {
			this._api = express();
			this._http = require('http').createServer(this._api);
			this._io = io(this._http);

			this._io.on('connection', (socket) => {

				socket.on('read', async (params, cb: Function) => {
					try {
						cb(null, await this.read(params));
					} catch (error) {
						log.error('Cache', error);
						cb(error);
					}
				});

				socket.on('symbol:list', async (params, cb: Function) => {
					cb(null, this._symbolList);
				});
			});

			this._http.listen(3001, (err) => {
				if (err)
					return reject(err);

				log.info('Cache',  'Listening on port 3001');

				resolve();
			});
		});
	}

	private _onTickReceive(tick): void {
		if (!this._tickBuffer[tick.instrument])
			this._tickBuffer[tick.instrument] = [];

		this._tickBuffer[tick.instrument].push([tick.time, tick.bid, tick.ask]);
	}

	private _startBroadcastInterval() {
		this._tickIntervalTimer = setInterval(() => {
			if (!Object.getOwnPropertyNames(this._tickBuffer).length) return;

			if (this.ipc)
				this.ipc.send('main', 'ticks', this._tickBuffer);

			if (this._io)
				this._io.sockets.emit('ticks', this._tickBuffer);

			this._tickBuffer = {};
		}, 200);
	}

	private _stopBroadcastInterval() {
		clearInterval(this._tickIntervalTimer);
	}

	private _setChannelEvents(): void {
		this.ipc.on('read', (params, cb) => {
			this
				.read(params)
				.then(data => cb(null, data))
				.catch(cb);
		});

		this.ipc.on('fetch', (opt, cb) => {
			this.fetch(opt, true)
				.then(() => cb(null))
				.catch(cb);
		});

		this.ipc.on('@reset', (opt, cb) => {
			this
				.reset()
				.then(data => cb(null, data))
				.catch(cb);
		});

		this.ipc.on('register', (opt, cb) => {
			this._listeners[opt.id] = opt.symbol;
			cb(null);
		});

		this.ipc.on('unregister', (opt, cb) => {
			delete this._listeners[opt.id];
			cb(null);
		});

		// this.ipc.on('symbol:list', (opt, cb) => {
		// 	cb(null, this._symbolList);
		// });

		this.ipc.on('broker:settings', async (accountSettings: AccountSettings, cb) => {
			this.options.settings.account = accountSettings;

			try {
				cb(null, await this._setBrokerApi())
			} catch (error) {
				log.error('Cache', error);
				this._debug('error', error);
				cb(error);

				await this._unsetBrokerApi();
			}
		});
	}

	private async _setBrokerApi(): Promise<void> {
		await this._unsetBrokerApi();

		this._brokerApi = new OandaApi(this.options.settings.account);
		this._brokerApi.on('error', error => this._debug('error', error));
		await this._brokerApi.init();

		await this._loadAvailableSymbols();

		await this._openTickStream();

		log.info('Cache', 'Broker connected');
	}

	private async _unsetBrokerApi(): Promise<void> {
		this._tickStreamOpen = false;
		this._mapper.streamOpenSince = null;

		if (this._brokerApi === null)
			return;

		try {
			await this._brokerApi.destroy();
		} catch (error) {
			console.error(error);
		}

		this._brokerApi = null;

		log.info('Cache', 'Broker disconnected');
	}

	private async _loadAvailableSymbols(): Promise<void> {
		let symbolList = await this._brokerApi.getSymbols();

		let currentPrices = await this._brokerApi.getCurrentPrices(symbolList.map(symbol => symbol.name));

		symbolList.forEach(symbol => {
			let price = currentPrices.find(priceObj => priceObj.instrument === symbol.name);

			symbol.bid = price.bid;
			symbol.ask = price.ask;
		});

		await this._dataLayer.createInstrumentTables(symbolList.map(symbol => symbol.name));

		this._symbolList = symbolList;

		log.info('Cache', 'Symbol list loaded');
	}

	private async _openTickStream(): Promise<any> {
		this._brokerApi.removeAllListeners('tick');

		await this._brokerApi.subscribePriceStream(this._symbolList.map(symbol => symbol.name));

		this._brokerApi.on('tick', tick => this._onTickReceive(tick));
		this._tickStreamOpen = true;
		this._mapper.streamOpenSince = Date.now();

		log.info('Cache', 'Tick stream opened');
	}

	private _debug(type: string, text: string, data?: any, code?: number) {
		if (this.ipc)
			this.ipc.send('main', 'debug', {type, text, data, code});
	}
}