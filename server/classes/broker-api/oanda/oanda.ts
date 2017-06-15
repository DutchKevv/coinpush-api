import {splitToChunks} from '../../../util/date';
import * as winston from 'winston-color';
import * as Stream 	from 'stream';
import {Base} 		from "../../../../shared/classes/Base";

const OANDAAdapter = require('./oanda-adapter/index');

export default class BrokerApi extends Base {

	static FAVORITE_SYMBOLS = [
		'EUR_USD',
		'BCO_USD',
		'NZD_AUD'
	];


	private _client = null;

	public async init() {
		await super.init();

		this._client = new OANDAAdapter({
			// 'live', 'practice' or 'sandbox'
			environment: this.options.environment,
			// Generate your API access in the 'Manage API Access' section of 'My Account' on OANDA's website
			accessToken: this.options.token,
			// Optional. Required only if environment is 'sandbox'
			username: this.options.username
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

	public subscribeEventStream() {
		this._client.subscribeEvents(function (event) {
			console.log(event);
		}, this);
	}

	public subscribePriceStream(instrument) {
		this._client.subscribePrice(this.options.accountId, instrument, tick => this.emit('tick', tick), this);
	}

	public unsubscribePriceStream(instrument) {

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

	public getCandles(symbol, timeFrame, from, until, count, onData, onDone) {
		let countChunks = splitToChunks(timeFrame, from, until, count, 5000);
		let finished = 0;

		countChunks.forEach(chunk => {
			let arr = [];
			let leftOver = '';
			let startFound = false;
			let now = Date.now();

			let transformStream = new Stream.Transform();

			transformStream._transform = function (data, type, done) {
				if (!this._firstByte) {
					this._firstByte = true;
					winston.info(`OANDA: FirstByte of ${symbol} took: ${Date.now() - now} ms`);
				}

				if (!startFound) {
					let start = data.indexOf(91);
					if (start > -1) {
						startFound = true;
						data = data.slice(start, data.length);
					} else {
						return done();
					}
				}

				let valArr = (leftOver + data.toString()).split(':');
				leftOver = valArr.pop();

				valArr.forEach(val => {
					let value = val.replace(/[^\d\.]/g, '');

					if (typeof value === 'string' && value !== '')
						arr.push(+value);
				});

				let maxIndex = this._lastPiece ? arr.length : (Math.floor(arr.length / 5000) * 5000),
					buf;

				if (this._lastPiece)

				if (maxIndex === 0)
					return done();

				buf = Buffer.alloc(maxIndex * Float64Array.BYTES_PER_ELEMENT, 0, 'binary');

				arr.forEach((value, index) => {
					if (index < maxIndex)
						buf.writeDoubleLE(index % 10 ? value : value / 1000, index * Float64Array.BYTES_PER_ELEMENT, false);
				});

				transformStream.push(buf);

				arr = arr.slice(maxIndex, arr.length);

				done();
			};

			transformStream._flush = function(done) {
				this._lastPiece = true;
				this.push();
				done();
			};

			this._client.getCandles(symbol, chunk.from, chunk.until, timeFrame, chunk.count)
				.pipe(transformStream)
				.on('data', onData)
				.on('error', onDone)
				.on('end', () => {
					if (++finished === countChunks.length)
						onDone();
				});
		});
	}

	public getCurrentPrices(symbols: Array<any>): Promise<Array<any>> {
		return new Promise((resolve, reject) => {

			this._client.getPrice(symbols, (err, prices) => {
				if (err)
					return reject(err);

				resolve(prices);
			});
		});
	}

	public async destroy(): Promise<void> {
		this.removeAllListeners();

		if (this._client)
			await this._client.kill();

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
}