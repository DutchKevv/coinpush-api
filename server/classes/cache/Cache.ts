import * as path        from 'path';
import * as mkdirp      from 'mkdirp';
import * as express    	from 'express';
import * as io          from 'socket.io';

import Mapper           from './CacheMap';
import Fetcher          from './CacheFetch';
import WorkerChild      from '../worker/WorkerChild';
import BrokerApi        from '../broker-api/oanda/oanda';
import CacheDataLayer   from './CacheDataLayer';
import {winston}     	from '../../logger';

export default class Cache extends WorkerChild {

	static COUNT_DEFAULT = 500;

	public settings: { account: AccountSettings, path: any };

	private _ready = false;
	private _brokerApi: BrokerApi = null;
	private _dataLayer: CacheDataLayer;
	private _mapper: Mapper;
	private _fetcher: Fetcher;
	private _symbolList: Array<any> = [];
	private _listeners = {};
	private _api: any = null;
	private _http: any = null;
	private _io: any = null;

	private _tickStreamOpen: boolean = false;

	private _tickBuffer = {};
	private _tickIntervalTimer = null;

	public async init() {
		await super.init();

		this.settings = this.options.settings;

		// Ensure cache dir exists
		mkdirp.sync(this.settings.path.cache);

		this._dataLayer = new CacheDataLayer({
			path: path.join(this.settings.path.cache, 'database.db')
		});

		this._mapper = new Mapper({path: this.settings.path.cache});
		this._fetcher = new Fetcher({dataLayer: this._dataLayer, mapper: this._mapper, brokerApi: this._brokerApi});

		await this._dataLayer.init();
		await this._mapper.init();
		await this._fetcher.init();

		this._setChannelEvents();
		await this.ipc.startServer();

		this._setTickInterval();

		await this._initApi();
	}

	public async read(params: { symbol: string, timeFrame: string, from: number, until: number, count: number }): Promise<any> {
		let symbol = params.symbol,
			timeFrame = params.timeFrame,
			from = params.from,
			until = params.until,
			count = params.count,
			candles = Buffer.alloc(0),
			softUntil;

		if (!symbol || typeof symbol !== 'string')
			throw new Error('Cache->Read : No symbol given');

		if (!timeFrame || typeof timeFrame !== 'string')
			throw new Error('Cache->Read : No timeFrame given');

		if (count && from && until)
			throw new Error('Cache->Read : Only from OR until can be given when using count, not both');

		if ((!from && !until))
			until = params.until = Date.now();

		softUntil = until > this._mapper.streamOpenSince ? this._mapper.streamOpenSince : until;

		// console.log('asfsafdsf', until);

		count = params.count = params.count || Cache.COUNT_DEFAULT;

		// If full dateRange given,
		// Its possible to check if range is complete purely on mapper
		if (from && until) {
			if (!this._mapper.isComplete(symbol, timeFrame, from, softUntil, count))
				await this.fetch(params);

			candles = await this._dataLayer.read(params);
		}
		// Count given
		// First read, then check in mapper if data is complete by first/last candles
		// Otherwise fetch and read again
		else {
			candles = await this._dataLayer.read(params);

			if (candles.length) {
				let first = candles.readDoubleLE(0),
					last = candles.readDoubleLE(candles.length - (10 * Float64Array.BYTES_PER_ELEMENT));

				if (!this._mapper.isComplete(symbol, timeFrame, from || first, softUntil || last)) {
					await this.fetch(params);
					candles = await this._dataLayer.read(params);
				}
			} else {
				await this.fetch(params);
				candles = await this._dataLayer.read(params);
			}
		}

		return candles;
	}

	public async fetch(params: { symbol: string, timeFrame: string, from: number, until: number, count: number }, emitStatus?: boolean): Promise<void> {
		let symbol = params.symbol,
			timeFrame = params.timeFrame,
			from = params.from,
			until = params.until,
			count = params.count;

		winston.info(`Cache: Fetching ${symbol} from ${from} until ${until} count ${count}`);

		if (count && from && until)
			throw new Error('Cache->fetch : Only from OR until can be given when using count, not both');

		// Get missing chunks
		let chunks = this._mapper.getMissingChunks(symbol, timeFrame, from, until, count),
			done = 0;

		console.log('missing chunks', chunks);

		if (!chunks.length)
			return;

		// Fire all missing chunk request
		await Promise.all(chunks.map(chunk => {

			return new Promise((resolve, reject) => {
				let now = Date.now(),
					streamChunkTotal = 0,
					streamChunkWritten = 0,
					endTriggered = false,
					total = 0;

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
						}, false);
					}

					if (done === chunks.length && streamChunkWritten === streamChunkTotal)
						resolve();

				}, err => {

					if (err)
						return reject(err);

					// Update the total request
					this._mapper.update(symbol, timeFrame, from, until, total);

					winston.info(`Cache: Fetching ${symbol} took ${Date.now() - now} ms`);

					endTriggered = true;

					if (++done === chunks.length && streamChunkWritten === streamChunkTotal)
						resolve();
				});
			});
		}));
	}

	public async reset(symbol?: string, timeFrame?: string, from?: number, until?: number): Promise<any> {
		winston.info('Reset cache');

		await Promise.all([
			this._mapper.reset(symbol, timeFrame),
			this._dataLayer.reset()
		]);

		return this._dataLayer.createInstrumentTables(this._symbolList.map(symbol => symbol.name));
	}

	private _initApi() {
		return new Promise((resolve, reject) => {
			this._api = express();
			this._http = require('http').createServer(this._api);
			this._io = io(this._http);

			this._io.on('connection', (socket) => {

				socket.on('read', async (params, cb) => {
					try {
						let buffer = await this.read(params),
							arr = new Float64Array(buffer.buffer, buffer.byteOffset, buffer.length / Float64Array.BYTES_PER_ELEMENT);

						cb(null, buffer.buffer);
						// cb(null, Array.from(arr));
					} catch (error) {
						winston.info(error);
						cb(error);
					}
				})
			});

			this._http.listen(3001, (err) => {
				if (err)
					return reject(err);

				winston.info('Cache -> Listening on port 3001');

				resolve();
			});
		});

	}

	private _onTickReceive(tick): void {
		if (!this._tickBuffer[tick.instrument])
			this._tickBuffer[tick.instrument] = [];

		this._tickBuffer[tick.instrument].push([tick.time, tick.bid, tick.ask]);
	}

	private _setTickInterval() {
		this._tickIntervalTimer = setInterval(() => {
			if (!Object.getOwnPropertyNames(this._tickBuffer).length) return;

			this.ipc.send('main', 'ticks', this._tickBuffer, false);

			this._tickBuffer = {};
		}, 200);
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

		this.ipc.on('symbol:list', (opt, cb) => {
			cb(null, this._symbolList);
		});

		this.ipc.on('broker:settings', async (accountSettings: AccountSettings, cb) => {
			this.settings.account = accountSettings;
			cb(null, await this._setBrokerApi())
		});
	}

	private async _setBrokerApi(): Promise<boolean> {
		this._ready = false;

		try {
			await this._unsetBrokerApi();

			this._brokerApi = new BrokerApi(this.settings.account);
			await this._brokerApi.init();

			this._brokerApi.on('error', error => {
				console.log('Cache -> Broker Error : ', error);
			});

			if (await this._loadAvailableSymbols() === true && await this._openTickStream() === true) {
				this._ready = true;
			}
		} catch (error) {
			console.error(error);
		}

		return this._ready;
	}

	private async _unsetBrokerApi(): Promise<void> {
		this._tickStreamOpen = false;
		this._mapper.streamOpenSince = null;

		if (!this._brokerApi)
			return;

		await this._brokerApi.destroy();
		this._brokerApi = null;
	}

	private async _loadAvailableSymbols(): Promise<boolean> {
		winston.info('loading instruments list');

		try {
			let symbolList = await this._brokerApi.getSymbols();
			let currentPrices = await this._brokerApi.getCurrentPrices(symbolList.map(symbol => symbol.name));

			symbolList.forEach(symbol => {
				let price = currentPrices.find(priceObj => priceObj.instrument === symbol.name);

				symbol.bid = price.bid;
				symbol.ask = price.ask;
			});

			await this._dataLayer.createInstrumentTables(symbolList.map(symbol => symbol.name));

			this._symbolList = symbolList;

			return true;
		} catch (error) {
			console.log(error);
			return false;
		}
	}

	private async _openTickStream(): Promise<any> {
		winston.info('opening tick stream');

		this._brokerApi.removeAllListeners('tick');

		try {

			await Promise.all(this._symbolList.map(symbol => this._brokerApi.subscribePriceStream(symbol.name)));

			this._brokerApi.on('tick', tick => this._onTickReceive(tick));
			this._tickStreamOpen = true;
			this._mapper.streamOpenSince = Date.now();

			return true;
		} catch (error) {
			return false;
		}
	}
}