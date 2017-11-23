import * as fs from 'fs';
import * as mongoose from 'mongoose';
import {log} from '../../../shared/logger';
import {timeFrameSteps} from '../../../shared/util/util.date';
import {CandleSchema} from '../schemas/candle';
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

		const qs = {time: {}};

		if (from)
			qs.time['$gt'] = from;

		if (until)
			qs.time['$lt'] = until;

		const rows = await model.find(qs).limit(count || 1000);

		return Buffer.concat(rows.map(row => row.data), rows.length * (10 * Float64Array.BYTES_PER_ELEMENT));
	},

	async write(symbol, timeFrame, buffer: NodeBuffer): Promise<any> {

		if (!buffer.length)
			return;

		if (buffer.length % Float64Array.BYTES_PER_ELEMENT !== 0)
			throw Error(`DataLayer: Illegal buffer length, should be multiple of 8 (is ${buffer.length})`);

		let model = mongoose.model(this.getCollectionName(symbol, timeFrame)),
			rowLength = 10 * Float64Array.BYTES_PER_ELEMENT,
			i = 0;

		const documents = [];
		while (i < buffer.byteLength)
			documents.push({time: buffer.readDoubleLE(i, true), data: buffer.slice(i, i += rowLength)});

		return model.insertMany(documents);
	},

	setModels(symbols) {
		let timeFrames = Object.keys(timeFrameSteps);

		log.info('DataLayer', 'Creating ' + symbols.length * timeFrames.length + ' tables');

		symbols.forEach(symbol => {
			timeFrames.forEach(async timeFrame => {
				mongoose.model(this.getCollectionName(symbol, timeFrame), CandleSchema);
				await Status.update({symbol: symbol.name, timeFrame}, {symbol, timeFrame, lastSync: null}, {upsert: true});
			});
		});
	},

	getCollectionName(symbol, timeFrame): string {
		return symbol.toLowerCase() + '_' + timeFrame.toLowerCase();
	},

	async reset(symbol?: string, timeFrame?: string, from?: number, until?: number): Promise<void> {
		// TODO
	}
}