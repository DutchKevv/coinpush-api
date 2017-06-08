import * as winston		from 'winston-color';
import Mapper           from './CacheMap';
import BrokerApi        from '../broker-api/oanda/oanda';
import CacheDataLayer from './CacheDataLayer';

export default class Fetcher {

	private _mapper: Mapper;
	private _dataLayer: CacheDataLayer;

	private _pendingRanges: any = {};

	constructor(opt) {
		this._mapper = opt.mapper;
		this._dataLayer = opt.dataLayer;
	}

	async init() {}

	public async fetch(brokerApi: BrokerApi, instrument: string, timeFrame: string, from: number, until: number, count: number) {

		return new Promise((resolve, reject) => {
			brokerApi.getCandles(instrument, timeFrame, from, until, count)
				.on('data', async (buf: NodeBuffer) => {

					await this._dataLayer.write(instrument, timeFrame, buf);

					if (from && until) {
						await this._mapper.update(instrument, timeFrame, from, until, buf.length / (10 * Float64Array.BYTES_PER_ELEMENT));
					} else {
						if (buf.length) {
							if (!from)
								from = buf.readDoubleLE(0);
							console.log(buf.length);
							if (!until)
								until = buf.readDoubleLE(buf.length - (9 * Float64Array.BYTES_PER_ELEMENT));

							if (from && until)
								await this._mapper.update(instrument, timeFrame, from, until, buf.length / (10 * Float64Array.BYTES_PER_ELEMENT));
						}
					}

				})
				.on('end', resolve)
				.on('error', reject)
		});
	}

	private _getPendingRequest(instrument, timeFrame) {
		if (!this._pendingRanges[instrument] || !this._pendingRanges[instrument][timeFrame])
			return [];

		return this._pendingRanges[instrument];
	}

	private _setPendingRequest(instrument, timeFrame, from, until) {
		if (!this._pendingRanges[instrument])
			this._pendingRanges[instrument] = {};

		if (!this._pendingRanges[instrument][timeFrame])
			this._pendingRanges[instrument][timeFrame] = [];

		this._pendingRanges[instrument][timeFrame].push([from, until]);
	}

	private _clearPendingRequest(instrument, timeFrame, from, until) {
		let pending = this._pendingRanges[instrument][timeFrame],
			i = 0, len = pending.length;

		for (; i < len; i++) {
			if (pending[i] && pending[i][0] === from && pending[i][1] === until)
				pending.splice(i, 1);
		}
	}
}