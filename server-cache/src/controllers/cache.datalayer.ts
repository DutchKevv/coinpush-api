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
mongoose.connect(config.server.cache.connectionString);

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

		const model = mongoose.model(this.getCollectionName(symbol, timeFrame));

		const qs = { time: {} };

		if (from)
			qs.time['$gt'] = from;

		if (until)
			qs.time['$lt'] = until;

		const rows = await model.find(qs).limit(count || 1000);

		// console.log('adxcvxc', rows[0].data.length, rows[0].data.byteLength);
		// console.log(new Float64Array(Buffer.from(rows[0].data)));
		// console.log('before concat', rows[0].data.length, new Float64Array(rows[0].data.buffer, rows[0].data.byteOffset, 10));
		const buffer = Buffer.concat(rows.map(row => row.data), rows.length * Float64Array.BYTES_PER_ELEMENT * 10);
		// console.log('afetr concat', new Float64Array(buffer.buffer));
		return buffer;
	},

	async write(symbol, timeFrame, candles: Float64Array): Promise<any> {

		if (!candles.length)
			return;

		let collectionName = this.getCollectionName(symbol, timeFrame),
			model = mongoose.model(collectionName),
			rowLength = 10, i = 0;

		console.log(`WRITING ${candles.length / 10} candles to ${collectionName}`);
		// console.log('WRITING', candles);
		const documents = [];
		while (i < candles.length) {
			if (!candles[i])
				throw new Error('NO TIME!');
			// console.log('TIME TIME', candles[i], typeof candles[i]);
			let time = candles[i];
			const buffer = Buffer.from(candles.slice(i, i += rowLength).buffer);
			
			// console.log('sadf', new Date(time * 1000));
			documents.push({ time: time, data: buffer });
		}

		if (candles.length)
			return model.updateMany({}, documents).then(() => {
				return Status.update({ symbol, timeFrame }, { lastSync: candles[candles.length - 10] })
			});
		else
			return Promise.resolve();
	},

	async setModels(symbols) {
		let timeFrames = Object.keys(timeFrameSteps);

		log.info('DataLayer', 'Creating ' + symbols.length * timeFrames.length + ' tables');

		await Promise.all(symbols.map(symbol => {

			return timeFrames.map(async timeFrame => {

				mongoose.model(this.getCollectionName(symbol, timeFrame), CandleSchema);

				// Create update document if not exists
				const updateStatus = await Status.update({ symbol, timeFrame }, { symbol, timeFrame }, { upsert: true, new: true, setDefaultsOnInsert: true });
			});
		}));
	},

	getCollectionName(symbol, timeFrame): string {
		return symbol.toLowerCase() + '_' + timeFrame.toLowerCase();
	},

	async reset(symbol?: string, timeFrame?: string, from?: number, until?: number): Promise<void> {
		// TODO
	}
}