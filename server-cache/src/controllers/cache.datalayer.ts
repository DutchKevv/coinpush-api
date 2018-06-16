import * as fs from 'fs';
import * as mongoose from 'mongoose';
import { log } from 'coinpush/util/util.log';
import { timeFrameSteps } from 'coinpush/util/util.date'
import { CandleSchema } from '../schemas/candle.schema';
import { Status } from '../schemas/status.schema';
import { BulkWriteResult } from 'mongodb';

const config = require('../../../coinpush.config.js');

const READ_COUNT_DEFAULT = 400;

/**
 * handle all symbol specific actions that do concern writing data
 */
export const dataLayer = {

	async read(params: { symbol: string, timeFrame: string, from?: number, until?: number, count?: number | string, fields?: any, toArray?: boolean }): Promise<Array<Array<Number>>> {

		// symbol required
		if (!params.symbol || typeof params.symbol !== 'string')
			throw new Error('Cache -> Read : No symbol given');

		// timeFrame required
		if (!params.timeFrame || typeof params.timeFrame !== 'string')
			throw new Error('Cache -> Read : No timeFrame given');

		let timeFrame = params.timeFrame,
			from = params.from,
			until = params.until,
			count = parseInt((<any>params.count), 10) || READ_COUNT_DEFAULT;


		if (from && until)
			throw new Error('dataLayer: "from" and "until" cannot both pe passes as params');

		const collectionName = this.getCollectionName(params.symbol, timeFrame);
		const model = mongoose.model(collectionName, CandleSchema);
		const qs: any = {};

		// log.info('DataLayer', `Read ${collectionName} from ${from} until ${until} count ${count}`);

		if (from) {
			qs._id = qs._id || {};
			qs._id['$gt'] = from;
		}

		if (until) {
			qs._id = qs._id || {};
			qs._id['$lt'] = until;
		}

		const rows = <Array<any>>await model.find({}, { data: 1 }).limit(count || 500).sort({ _id: -1 });

		return rows.map(row => row.data);
	},

	async write(symbol, timeFrame, candles: Array<any>): Promise<BulkWriteResult> {
		if (!candles.length)
			return;

		let collectionName = this.getCollectionName(symbol, timeFrame),
			model = mongoose.model(collectionName, CandleSchema),
			bulk = model.collection.initializeOrderedBulkOp(),
			rowLength = 6, i = 0, len = candles.length;

		// quick quality check (needs minimum 2 candles)
		if (candles.length > rowLength)
			if (candles[0] >= candles[rowLength])
				throw new Error(`DataLayer - Write: Candle array timestamp needs to be in a forward order ${new Date(candles[0])} / ${new Date(candles[rowLength])}`)

		for (; i < candles.length;) {
			const time = candles[i];
			bulk.find({ _id: time }).upsert().replaceOne({ $set: { _id: time, data: candles.slice(i, i += rowLength) } });
		}

		const bulkResult = await bulk.execute();
		const lastCandleTime = candles[candles.length - rowLength];
		const lastCloseBidPrice = candles[candles.length - 2];

		const result = await Status.update({ symbol }, { $set: { lastPrice: lastCloseBidPrice, [`timeFrames.${timeFrame}.lastCandleTime`]: lastCandleTime } });

		if (!result.n)
			throw new Error(`Status not found! [${symbol}]`);

		return bulkResult;
	},

	async createCollections(symbols: Array<any>): Promise<void> {
		const now = Date.now();
		const timeFrames = Object.keys(timeFrameSteps);
		const bulk = Status.collection.initializeUnorderedBulkOp();

		log.info('DataLayer', 'Creating ' + symbols.length + ' collections');

		for (let i = 0; i < symbols.length; i++) {
			const symbol = symbols[i];

			for (let k = 0; k < timeFrames.length; k++) {
				let timeFrame = timeFrames[k];

				bulk.find({ symbol: symbol.name }).upsert().updateOne({
					$set: {
						broker: symbol.broker,
						symbol: symbol.name,
						[`timeFrames.${timeFrame}.collectionName`]: this.getCollectionName(symbol.name, timeFrame),
						[`timeFrames.${timeFrame}.timeFrame`]: timeFrame
					}
				});
			}
		}

		// mongo crashes on empty bulk
		if (bulk.length)
			await bulk.execute();

		log.info('CacheController', `Creating ${symbols.length} collections took ${Date.now() - now}ms`);
	},

	getCollectionName(symbol, timeFrame): string {
		return symbol.toLowerCase() + '_' + timeFrame.toLowerCase();
	},

	async reset(symbol?: string, timeFrame?: string, from?: number, until?: number): Promise<void> {
		// TODO
	}
}