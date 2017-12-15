import { Event } from '../schemas/event.schema';
import * as mongoose from 'mongoose';
import { CUSTOM_EVENT_TYPE_ALARM, ALARM_TRIGGER_TYPE_PRICE, ALARM_TRIGGER_TYPE_PERCENTAGE, ALARM_TRIGGER_DIRECTION_DOWN, ALARM_TRIGGER_DIRECTION_UP } from '../../../shared/constants/constants';
import { client } from '../modules/redis';
import { flatten } from 'lodash';

const config = require('../../../tradejs.config');

export const eventController = {

	findById(reqUser, params) {

	},

	findMany(reqUser, params: any = {}) {
		const opt: any = {
			userId: reqUser.id,
			triggered: !!params.history
		};
		const fields: any = {
			createDate: 1,
			symbol: 1, 
			alarm: 1, 
			type: 1 
		};

		if (typeof params.symbol === 'string')
			opt.symbol = params.symbol.toUpperCase();

		if (params.history) {
			fields.triggeredDate = 1;
		}

		return Event.find(opt, fields).lean();
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
					dir: params.alarm.dir
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

	async checkEvents() {
		return new Promise((resolve, reject) => {

			client.get('symbols', async (err, symbols) => {
				if (err)
					return reject(err);

				if (!symbols)
					return resolve();

				symbols = JSON.parse(symbols);

				for (let i = 0, len = symbols.length; i < len; i++) {
					let symbol = symbols[i];
					let events = <any>flatten(await Promise.all(
						[
							Event.find({ triggered: false, symbol: symbol.name, 'alarm.dir': ALARM_TRIGGER_DIRECTION_UP, 'alarm.price': { $gt: symbol.high } }),
							Event.find({ triggered: false, symbol: symbol.name, 'alarm.dir': ALARM_TRIGGER_DIRECTION_DOWN, 'alarm.price': { $lt: symbol.low } }),
						]
					));

					if (events.length) {
						console.log('events', events);
						for (let k = 0, lenk = events.length; k < lenk; k++) {
							const event = events[k];
							event.triggered = true;
							event.triggeredDate = new Date();
							event.save();
						}
					}
				}

				resolve();
			});
		});
	}
};