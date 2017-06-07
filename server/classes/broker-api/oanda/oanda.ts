import Base from '../../Base';
import * as constants from '../../../../shared/constants/broker';
import {splitToChunks} from '../../../util/date';
import {flatten} from 'lodash';
import * as fs from 'fs';
import * as Stream from 'stream';

const OANDAAdapter = require('./oanda-adapter/index');

export default class BrokerApi extends Base {

	private _client = null;

	constructor(private _accountSettings: AccountSettings) {
		super()
	}

	public async init() {
		this._client = new OANDAAdapter({
			// 'live', 'practice' or 'sandbox'
			environment: this._accountSettings.environment,
			// Generate your API access in the 'Manage API Access' section of 'My Account' on OANDA's website
			accessToken: this._accountSettings.token,
			// Optional. Required only if environment is 'sandbox'
			username: this._accountSettings.username
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
		this._client.subscribePrice(this._accountSettings.accountId, instrument, tick => this.emit('tick', tick), this);
	}

	public unsubscribePriceStream(instrument) {

	}

	public getInstruments(): any {
		return new Promise((resolve, reject) => {
			this._client.getInstruments(this._accountSettings.accountId, (err, instruments) => {
				if (err)
					return reject(err);

				resolve(instruments);
			});
		});
	}

	public getCandles(instrument, timeFrame, from, until, count): NodeJS.ReadableStream {
		let countChunks = splitToChunks(timeFrame, from, until, count, 5000);
		let finished = 0;

		let readStream = new Stream.PassThrough();

		countChunks.forEach(chunk => {
			let arr = [];
			let leftOver = '';
			let startFound = false;

			this._client
				.getCandles(instrument, chunk.from, chunk.until, timeFrame, chunk.count)
				.on('data', data => {
					if (!startFound) {
						let start = data.indexOf(91);

						if (start > -1) {
							startFound = true;
							data = data.slice(start, data.length);
						} else {
							return;
						}
					}

					let valArr = (leftOver + data.toString('ascii')).split(':');
					leftOver = valArr.pop();

					if (!valArr.length)
						return;

					valArr.forEach(val => {
						let value = val.replace(/[^\d\.]/g, '');

						if (value !== '')
							arr.push(+value);
					});

					let maxIndex = Math.floor(arr.length / 10) * 10;
					let buf = Buffer.alloc(maxIndex * Float64Array.BYTES_PER_ELEMENT, 0, 'binary');

					arr.forEach((value, index) => {
						if (index < maxIndex)
							buf.writeDoubleLE(index % 10 ? value : value / 1000, index * Float64Array.BYTES_PER_ELEMENT, true);
					});

					if (buf.byteLength)
						readStream.push(buf);

					arr = arr.slice(maxIndex, arr.length);

				})
				.on('error', error => !console.log('ERROR', error) && readStream.emit('error', error))
				.on('end', () => {
					if (++finished === countChunks.length)
						readStream.destroy();
				});
		});

		return readStream;
	}

	public getCurrentPrices(instruments: Array<any>): Promise<Array<any>> {
		return new Promise((resolve, reject) => {
			this._client.getPrice(instruments, (err, prices) => {
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