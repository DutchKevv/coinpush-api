import * as path        from 'path';
import * as mkdirp      from 'mkdirp';
import * as winston     from 'winston-color';

import Mapper           from './CacheMap';
import Fetcher          from './CacheFetch';
import WorkerChild      from '../worker/WorkerChild';
import BrokerApi        from '../broker-api/oanda/oanda';
import CacheDataLayer   from './CacheDataLayer';

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
	}

	public async read(params: {symbol: string, timeFrame: string, from: number, until: number, count: number}): Promise<any> {
		let symbol = params.symbol,
			timeFrame = params.timeFrame,
			from = params.from,
			until = params.until,
			count = params.count,
			candles = Buffer.alloc(0);
		
		if (!symbol || typeof symbol !== 'string')
			throw new Error('Cache-Read : No symbol given');

		if (!timeFrame || typeof timeFrame !== 'string')
			throw new Error('Cache-Read : No timeFrame given');

		if (!count && !from && !until)
			throw new Error('Cache->Read : At least, from, until or count must be given as argument');

		if (count && from && until)
			throw new Error('Cache->Read : Only from OR until can be given when using count, not both');

		if (!from && !until) {
			params.until = Date.now();
		}

		count = count || Cache.COUNT_DEFAULT;

		// If full dateRange given,
		// Its possible to check if range is complete purely on mapper
		if (from && until) {
			if (!this._mapper.isComplete(symbol, timeFrame, from, until, count))
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

				if (!this._mapper.isComplete(symbol, timeFrame, from || first, until || last)) {
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

	public async fetch(params: {symbol: string, timeFrame: string, from: number, until: number, count: number}, emitStatus?: boolean): Promise<void> {
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

					// Make sure there is a from to store in mapper
					from = from || buf.readDoubleLE(0);

					// Store candles in DB
					await this._dataLayer.write(symbol, timeFrame, buf);

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

	private _broadCastTick(tick): void {
		this.ipc.send('main', 'tick', tick, false);
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
			if (this._brokerApi)
				await this._brokerApi.destroy();

			this._brokerApi = new BrokerApi(this.settings.account);
			await this._brokerApi.init();

			this._brokerApi.on('error', error => {});
			this._brokerApi.on('tick', tick => this._broadCastTick(tick));

			if (await this._loadAvailableSymbols() === true && await this._openTickStream() === true) {
				this._ready = true;
			}
		} catch (error) {
			console.error(error);
		}

		return this._ready;
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

		try {
			await Promise.all(this._symbolList.map(symbol => this._brokerApi.subscribePriceStream(symbol.name)));
			return true;
		} catch (error) {
			return false;
		}
	}
}