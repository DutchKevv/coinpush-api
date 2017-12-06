import * as fs from 'fs';
import * as mongoose from 'mongoose';
import { log } from '../../../shared/logger';
import { timeFrameSteps } from '../../../shared/util/util.date';
import { CandleSchema } from '../schemas/candle';
import { Status } from '../schemas/status.schema';

const config = require('../../../tradejs.config');

/**
 *  Database
 */
const db = mongoose.connection;
mongoose.Promise = global.Promise;
mongoose.connect(config.server.cache.connectionString, { poolSize: 1 });

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
	console.log('Cache DB connected');
});

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
		const model = mongoose.model(collectionName);
		const qs: any = {};

		log.info('DataLayer', `Read ${collectionName} from ${from} until ${until} count ${count}`);

		if (from) {
			qs.time = qs.time || {};
			qs.time['$gt'] = from;
		}

		if (until) {
			qs.time = qs.time || {};
			qs.time['$lt'] = until;
		}

		const rows = await model.find({}).limit(count || 1000).sort({time: -1});
		const buffer = Buffer.concat(rows.reverse().map(row => row.data), rows.length * Float64Array.BYTES_PER_ELEMENT * 10);
		// console.log('afetr concat', new Float64Array(buffer.buffer));
		return buffer;
	},

	async write(symbol, timeFrame, candles: Float64Array): Promise<any> {
		if (!candles.length)
			return;

		let collectionName = this.getCollectionName(symbol, timeFrame),
			model = mongoose.model(collectionName),
			bulk = model.collection.initializeUnorderedBulkOp(),
			rowLength = 10, i = 0;

		// log.info('DataLayer', `WRITING ${candles.length / 10} candles to ${collectionName} starting ${new Date(candles[0])} until ${new Date(candles[candles.length - 10])}`);

		while (i < candles.length) {
			const time = new Date(candles[i]);
			const data = Buffer.from(candles.slice(i, i += rowLength).buffer);

			bulk.find({ time }).upsert().update({ $set: { time, data } });
		}

		await bulk.execute();

		if (candles.length) {
			const lastCandleTime = candles[candles.length - 10];
			const lastCloseBidPrice = candles[candles.length - 7];

			await Status.update({ symbol, timeFrame }, { lastSync: lastCandleTime, lastPrice: lastCloseBidPrice });
		}
	},

	async setModels(symbols) {
		let timeFrames = Object.keys(timeFrameSteps);

		log.info('DataLayer', 'Creating ' + symbols.length * timeFrames.length + ' collections');

		for (let i = 0; i < symbols.length; i++) {
			let symbol = symbols[i];

			for (let k = 0; k < timeFrames.length; k++) {
				let timeFrame = timeFrames[k];

				mongoose.model(this.getCollectionName(symbol.name, timeFrame), CandleSchema);

				// Create update document if not exists
				await Status.update(
					{ symbol: symbol.name, timeFrame },
					{ symbol: symbol.name, timeFrame, broker: symbol.broker },
					{ upsert: true, setDefaultsOnInsert: true }
				);
			}
		}

		log.info('DataLayer', 'Creating collections done');
	},

	getCollectionName(symbol, timeFrame): string {
		return symbol.toLowerCase() + '_' + timeFrame.toLowerCase();
	},

	async reset(symbol?: string, timeFrame?: string, from?: number, until?: number): Promise<void> {
		// TODO
	}
}