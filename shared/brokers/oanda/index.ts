import * as Stream 		from 'stream';
import {Adapter} 		from './lib/OANDAAdapter';
import {splitToChunks} 	from '../../util/util.date';
import {log} 			from '../../logger';
import {EventEmitter} 	from 'events';
import {Base} 			from '../../classes/Base';
import * as Constants 	from '../../constants/constants';
import {ORDER_TYPE_IF_TOUCHED, ORDER_TYPE_LIMIT, ORDER_TYPE_MARKET, ORDER_TYPE_STOP} from '../../constants/constants';

export default class OandaApi extends EventEmitter {

	public static readonly FAVORITE_SYMBOLS = [
		'EUR_USD',
		'BCO_USD',
		'NZD_AUD'
	];

	public static readonly FETCH_CHUNK_LIMIT = 5000;
	public static readonly WRITE_CHUNK_COUNT = 5000;

	private _client = null;

	constructor(public options: any) {
		super();
	}

	public init() {
		
		this._client = new Adapter({
			// 'live', 'practice' or 'sandbox'
			environment: this.options.environment,
			// Generate your API access in the 'Manage API Access' section of 'My Account' on OANDA's website
			accessToken: this.options.token,
			// Optional. Required only if environment is 'sandbox'
			username: this.options.username
		});

		this._client.on('stream-timeout', () => {
			try {
				this.emit('stream-timeout')
			} catch (error) {
				console.log(error);
			}
		});
	}

	public async testConnection(): Promise<boolean> {
		// TODO: Stupid way to check, and should also check heartbeat
		try {
			await this.getAccounts();
			return true;
		} catch (error) {
			return false;
		}
	}

	public getAccounts(): Promise<any> {
		return new Promise((resolve, reject) => {
			this._client.getAccounts(function (err, accounts) {
				if (err)
					return reject(err);

				resolve(accounts);
			});
		})
	}

	public getTransactionHistory(minId: number): Promise<any> {
		return new Promise((resolve, reject) => {
			this._client.getTransactionHistory(this.options.accountId, minId, (err, transactions) => {
				if (err)
					return reject(err);

				resolve(transactions.reverse());
			})
		});
	}

	public getOpenOrders(): Promise<any> {
		return new Promise((resolve, reject) => {
			this._client.getOpenTrades(this.options.accountId, (err, orders) => {
				if (err)
					return reject(err);

				resolve(orders);
			})
		});
	}

	public subscribeEventStream(callback: Function) {
		this._client.subscribeEvents(event => callback(event));
	}

	public unsubscribeEventStream(listener: Function) {
		this._client.unsubscribeEvents(listener);
	}

	public subscribePriceStream(symbols: Array<string>): void {
		this._client.subscribePrices(this.options.accountId, symbols, tick => {
			this.emit('tick', tick);
		});
	}

	public unsubscribePriceStream(instruments) {
		this._client.unsubscribePrices(this.options.accountId, instruments, tick => this.emit('tick', tick));
	}

	public getSymbols(): any {
		return new Promise((resolve, reject) => {
			this._client.getInstruments(this.options.accountId, (err, symbols) => {

				if (err)
					return reject(err);

				symbols.forEach(symbol => {
					symbol.name = symbol.instrument;
					delete symbol.instrument;
				});

				resolve(symbols);
			});
		});
	}

	public getCandles(symbol: string, timeFrame: string, from: number, until: number, count: number, onData: Function, onDone: Function): void {
		let countChunks = splitToChunks(timeFrame, from, until, count, OandaApi.FETCH_CHUNK_LIMIT),
			writeChunks = 0,
			finished = 0;

		countChunks.forEach(chunk => {
			let arr = [];
			let leftOver = '';
			let startFound = false;
			let now = Date.now();
			
			this._client.getCandles(symbol, chunk.from, chunk.until, timeFrame, chunk.count, async (error, data: any) => {
				if (error)
					return console.error(error);
						
				const candles = new Float64Array(data.candles.length * 10);

				data.candles.forEach((candle, index) => {
					const startIndex = index * 10;

					candles[startIndex] = candle.time / 1000;
					candles[startIndex + 1] = candle.openBid;
					candles[startIndex + 2] = candle.openAsk;
					candles[startIndex + 3] = candle.highBid;
					candles[startIndex + 4] = candle.highAsk;
					candles[startIndex + 5] = candle.lowBid;
					candles[startIndex + 6] = candle.lowAsk;
					candles[startIndex + 7] = candle.closeBid;
					candles[startIndex + 8] = candle.closeAsk;
					candles[startIndex + 9] = candle.volume;
				});

				await onData(candles);
				
				if (++finished === countChunks.length)
					onDone();
			});

			// let transformStream = new Stream.Transform();

			// transformStream._transform = function (data, type, done) {
			// 	if (!this._firstByte) {
			// 		this._firstByte = true;
			// 		log.info('OANDA', `FirstByte of ${symbol} took: ${Date.now() - now} ms`);
			// 	}

			// 	if (!startFound) {
			// 		let start = data.indexOf(91);
			// 		if (start > -1) {
			// 			startFound = true;
			// 			data = data.slice(start, data.length);
			// 		} else {
			// 			return done();
			// 		}
			// 	}

			// 	let valArr = (leftOver + data.toString()).split(':');
			// 	leftOver = valArr.pop();

			// 	valArr.forEach(val => {
			// 		let value = val.replace(/[^\d\.]/g, '');

			// 		if (typeof value === 'string' && value !== '')
			// 			arr.push(+value);
			// 	});

			// 	let maxIndex = this._lastPiece ? arr.length : (Math.floor(arr.length / OandaApi.FETCH_CHUNK_LIMIT) * OandaApi.FETCH_CHUNK_LIMIT),
			// 		buf;

			// 	// if (this._lastPiece)
			// 		if (maxIndex === 0)
			// 			return done();

			// 	buf = Buffer.alloc(maxIndex * Float64Array.BYTES_PER_ELEMENT, 0, 'binary');

			// 	arr.forEach((value, index) => {
			// 		if (index < maxIndex)
			// 			buf.writeDoubleLE(index % 10 ? value : value / 1000, index * Float64Array.BYTES_PER_ELEMENT, false);
			// 	});

			// 	writeChunks++;
			// 	transformStream.push(buf);

			// 	arr = arr.slice(maxIndex, arr.length);

			// 	done();
			// };

			// // Make Typescript happy (does not know _flush)
			// (<any>transformStream)._flush = function(done) {
			// 	this._lastPiece = true;
			// 	this.push();
			// 	done();
			// };

			// this._client.getCandles(symbol, chunk.from, chunk.until, timeFrame, chunk.count)
			// 	.pipe(transformStream)
			// 	.on('data', onData)
			// 	.on('error', onDone)
			// 	.on('end', () => {
			// 		if (++finished === countChunks.length)
			// 			onDone(null, writeChunks);
			// 	});
		});
	}

	public getCurrentPrices(symbols: Array<any>): Promise<Array<any>> {
		return new Promise((resolve, reject) => {

			this._client.getPrices(symbols, (err, prices) => {
				if (err)
					return reject(err);

				resolve(prices);
			});
		});
	}

	public getOpenPositions() {

	}

	public getOrder(id) {

	}

	public getOrderList(options) {

	}

	public placeOrder(options) {
		return new Promise((resolve, reject) => {
			const _options = {
				instrument: options.symbol,
				units: options.amount,
				side: options.side === Constants.ORDER_SIDE_BUY ? 'buy' : 'sell',
				type: this.orderTypeConstantToString(options.type)
			};

			this._client.createOrder(this.options.accountId, _options, (err, result) => {
				if (err)
					return reject(err);

				resolve({
					openTime: result.time,
					openPrice: result.price,
					b_id: result.tradeOpened.id
				})
			});
		});
	}

	public closeOrder(id) {
		return new Promise((resolve, reject) => {
			this._client.closeOrder(this.options.accountId, id, (err, result) => {
				if (err)
					return reject(err);

				resolve(result);
			});
		});
	}

	public updateOrder(id, options) {

	}

	public destroy(): void {
		this.removeAllListeners();

		if (this._client)
			this._client.kill();

		this._client = null;
	}

	private _normalizeJSON(candles) {
		let i = 0, len = candles.length;

		for (; i < len; i++)
			candles[i].time /= 1000;

		return candles;
	}

	private normalizeJsonToArray(candles) {
		let i = 0, len = candles.length, rowLength = 10, candle,
			view = new Float64Array(candles.length * rowLength);

		for (; i < len; i++) {
			candle = candles[i];
			view[i * rowLength] = candle.time / 1000;
			view[(i * rowLength) + 1] = candle.openBid;
			view[(i * rowLength) + 2] = candle.openAsk;
			view[(i * rowLength) + 3] = candle.highBid;
			view[(i * rowLength) + 4] = candle.highAsk;
			view[(i * rowLength) + 5] = candle.lowBid;
			view[(i * rowLength) + 6] = candle.lowAsk;
			view[(i * rowLength) + 7] = candle.closeBid;
			view[(i * rowLength) + 8] = candle.closeAsk;
			view[(i * rowLength) + 9] = candle.volume;
		}

		return view;
	}

	private normalizeTypedArrayToBuffer(array) {
		return new Buffer(array.buffer);
	}

	private orderTypeConstantToString(type) {
		switch (type) {
			case ORDER_TYPE_MARKET:
				return 'market';
			case ORDER_TYPE_LIMIT:
				return 'limit';
			case ORDER_TYPE_STOP:
				return 'stop';
			case ORDER_TYPE_IF_TOUCHED:
				return 'marketIfTouched';
		}
	}
}