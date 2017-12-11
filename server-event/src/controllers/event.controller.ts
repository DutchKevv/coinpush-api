import {Event} from '../schemas/event.schema';
import * as mongoose from 'mongoose';
import { CUSTOM_EVENT_TYPE_ALARM, ALARM_TRIGGER_TYPE_PRICE, ALARM_TRIGGER_TYPE_PERCENTAGE } from '../../../shared/constants/constants';

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

	findMany(reqUser) {

	},

	async create(reqUser, params) {
		let result;
		console.log(params);
		if (params.type === CUSTOM_EVENT_TYPE_ALARM) {
			if (!params.amount)
				throw new Error('eventController - create: amount must be given');
				
			result = await Event.create({
				userId: reqUser.id,
				symbol: params.symbol,
				type: CUSTOM_EVENT_TYPE_ALARM,
				alarm: {
					price: params.type === ALARM_TRIGGER_TYPE_PRICE ? params.amount : undefined,
					perc: params.type === ALARM_TRIGGER_TYPE_PERCENTAGE ? params.amount : undefined
				}
			});
		}
	
		if (result)
			return {_id: result._id};
	},

	update(reqUser, params) {

	},

	remove(reqUser, eventId: string) {

	},

	onPriceChangePercentage() {

	}
};