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
		this._client.subscribePrice(this._accountSettings.accountId, instrument.toUpperCase(), tick => {
			// this.emit('tick', tick);
		}, this);
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
		let chunks = splitToChunks(timeFrame, from, until, count, 5000),
			done = 0;

		let readable = new Stream.PassThrough();

		chunks.forEach(chunk => {
			this._client.getCandles(instrument, chunk.from, chunk.until, timeFrame, chunk.count, (err, result) => {
				if (err)
					return; // TODO

				readable.push(new Buffer(this.normalizeJsonToArray(result).buffer));

				if (++done === chunks.length) {
					readable.emit('finish');
				}
			});
		});

		return readable;

		//
		// return Promise.all(chunks.map(chunk => {
		//
		// 	return new Promise((resolve, reject) => {
		// 		this._client.getCandles(instrument, chunk.from, chunk.until, timeFrame, chunk.count, (err, result) => {
		// 			if (err)
		// 				return reject(err);
		//
		// 			resolve(this.normalizeJsonToArray(result));
		// 		});
		// 	});
		// })).then(resultArr => {
		// 	console.log('console.log(resultArr.length);', resultArr.length);
		// 	let result = flatten(resultArr);
		// 	console.log('con22222222222th);', result.length);
		// 	return result;
		// });
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