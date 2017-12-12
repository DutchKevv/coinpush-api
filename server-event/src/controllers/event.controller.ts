import { Event } from '../schemas/event.schema';
import * as mongoose from 'mongoose';
import { CUSTOM_EVENT_TYPE_ALARM, ALARM_TRIGGER_TYPE_PRICE, ALARM_TRIGGER_TYPE_PERCENTAGE, ALARM_TRIGGER_DIRECTION_DOWN, ALARM_TRIGGER_DIRECTION_UP } from '../../../shared/constants/constants';

const config = require('../../../tradejs.config');

/**
 *  Database
 */
const db = mongoose.connection;
mongoose.connect(config.server.event.connectionString);

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
	console.log('Event DB connected');
});

export const eventController = {

	findById(reqUser, params) {

	},

	findMany(reqUser, params: any = {}) {
		const opt: any = { userId: reqUser.id };

		if (typeof params.symbol === 'string')
			opt.symbol = params.symbol.toLowerCase();

		return Event.find(opt, { symbol: 1, alarm: 1, type: 1, triggered: 1 }).lean();
	},

	async create(reqUser, params: any = {}) {
		let result;
		if (params.type === CUSTOM_EVENT_TYPE_ALARM) {
			if (!params.amount)
				throw new Error('eventController - create: amount must be given');

			result = await Event.create({
				userId: reqUser.id,
				symbol: params.symbol,
				name: params.name,
				type: CUSTOM_EVENT_TYPE_ALARM,
				alarm: {
					price: params.type === ALARM_TRIGGER_TYPE_PRICE ? params.amount : undefined,
					perc: params.type === ALARM_TRIGGER_TYPE_PERCENTAGE ? params.amount : undefined,
					dir: params.dir
				}
			});
		}

		if (result)
			return { _id: result._id };
	},

	update(reqUser, params) {

	},

	async remove(reqUser, eventId: string) {
		if (typeof eventId !== 'string')
			throw new Error('EventController - remove: eventId required')

		const result = await Event.remove({ _id: eventId });

		console.log(result);
	},

	async onNewBars(bars: Array<any>) {
		for (let i = 0, len = bars.length; i < len; i++) {
			let bar = bars[i];
			let events = [].concat(await Promise.all(
				[
					Event.find({ symbol: bar.symbol, 'alarm.dir': ALARM_TRIGGER_DIRECTION_UP, 'alarm.price': { $gt: bar.bid } }),
					Event.find({ symbol: bar.symbol, 'alarm.dir': ALARM_TRIGGER_DIRECTION_DOWN, 'alarm.price': { $lt: bar.bid } }),
				]
			));

			console.log(events);
		}
	},

	onPriceChangePercentage() {

	}
};