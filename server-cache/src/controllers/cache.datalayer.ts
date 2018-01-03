import * as fs from 'fs';
import * as mongoose from 'mongoose';
import { log } from '../../../shared/logger';
import { timeFrameSteps } from '../../../shared/util/util.date';
import { CandleSchema } from '../schemas/candle';
import { Status } from '../schemas/status.schema';
import { BulkWriteResult } from 'mongodb';

const config = require('../../../tradejs.config');

export const dataLayer = {

	async read(params: { symbol: string, timeFrame: string, from?: number, until?: number, count?: number, fields?: any }): Promise<NodeBuffer> {

		let symbol = params.symbol,
			timeFrame = params.timeFrame,
			from = params.from,
			until = params.until,
			count = params.count;

		if (from && until)
			throw new Error('dataLayer: "from" and "until" cannot both pe passes as params');

		const collectionName = this.getCollectionName(symbol, timeFrame);
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

		const rows = <Array<any>>await model.find({}).limit(count || 1000).sort({ _id: -1 });
		const buffer = Buffer.concat(rows.reverse().map(row => row.data), rows.length * Float64Array.BYTES_PER_ELEMENT * 10);
		// console.log('afetr concat', new Float64Array(buffer.buffer));
		return buffer;
	},

	async write(symbol, timeFrame, candles: Float64Array): Promise<BulkWriteResult> {
		if (!candles.length)
			return;

		let collectionName = this.getCollectionName(symbol, timeFrame),
			model = mongoose.model(collectionName, CandleSchema),
			bulk = model.collection.initializeOrderedBulkOp(),
			rowLength = 10, i = 0, len = candles.length;

		// quick quality check (needs minimum 2 candles)
		if (candles.length > rowLength)
			if (candles[0] >= candles[rowLength])
				throw new Error(`DataLayer - Write: Candle array timestamp needs to be in a forward order ${new Date(candles[0])} / ${new Date(candles[rowLength])}`)

		// log.info('DataLayer', `WRITING ${candles.length / 10} candles to ${collectionName} starting ${new Date(candles[0])} until ${new Date(candles[candles.length - 10])}`);

		for (; i < candles.length;) {
			const time = Math.trunc(candles[i]);
			const data = Buffer.from(candles.slice(i, i += rowLength).buffer);
			bulk.find({ _id: time }).upsert().replaceOne({ $set: { _id: time, data } });
		}

		const bulkResult = await bulk.execute();

		const lastCandleTime = candles[candles.length - 10];
		const lastCloseBidPrice = candles[candles.length - 3];

		const result = await Status.update({ collectionName, timeFrame }, { lastSync: lastCandleTime, lastPrice: lastCloseBidPrice });
		
		if (!result.n)
			throw new Error(`Status not found! [${symbol}]`);
			
		return bulkResult;
	},

	async createCollections(symbols: Array<any>) {
		const now = Date.now();
		const timeFrames = Object.keys(timeFrameSteps);
		const existingModels = mongoose.modelNames();
		const bulk = Status.collection.initializeUnorderedBulkOp();

		log.info('DataLayer', 'Creating ' + symbols.length * timeFrames.length + ' collections');

		for (let i = 0; i < symbols.length; i++) {
			let symbol = symbols[i];

			for (let k = 0; k < timeFrames.length; k++) {
				let timeFrame = timeFrames[k];

				const collectionName = this.getCollectionName(symbol.name, timeFrame);

				bulk.find({ collectionName }).upsert().updateOne({ $set: { collectionName, broker: symbol.broker, symbol: symbol.name, timeFrame } });
			}
		}

		// Mongo crashes if bulk is empty
		// if (bulk.length > 0)
		await bulk.execute();

		log.info('CacheController', `Creating collections took ${Date.now() - now}ms`);
	},

	getCollectionName(symbol, timeFrame): string {
		return symbol.toLowerCase() + '_' + timeFrame.toLowerCase();
	},

	async reset(symbol?: string, timeFrame?: string, from?: number, until?: number): Promise<void> {
		// TODO
	}
}