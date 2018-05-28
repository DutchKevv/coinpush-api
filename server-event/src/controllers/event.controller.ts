import { Event } from '../schemas/event.schema';
import * as mongoose from 'mongoose';
import { CUSTOM_EVENT_TYPE_ALARM, ALARM_TRIGGER_TYPE_PRICE, ALARM_TRIGGER_TYPE_PERCENTAGE, ALARM_TRIGGER_DIRECTION_DOWN, ALARM_TRIGGER_DIRECTION_UP } from 'coinpush/constant';
import { flatten } from 'lodash';
import { pubClient } from 'coinpush/redis';

const config = require('./../../../tradejs.config.js');

export const eventController = {

	findById(reqUser, params) {

	},

	findMany(reqUser, params: any = {}) {
		const opt: any = {
			userId: reqUser.id,
			triggered: !!params.history
		};
		const fields: any = {
			createdAt: 1,
			symbol: 1,
			alarm: 1,
			type: 1,
			triggeredDate: 1
		};

		if (typeof params.symbol === 'string')
			opt.symbol = params.symbol.toUpperCase();

		return Event.find(opt, fields).sort({ [params.history ? 'triggeredDate' : '_id']: -1 }).lean();
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

		return result;
	},

	update(reqUser, params) {

	},

	async remove(reqUser, eventId: string) {
		if (typeof eventId !== 'string')
			throw new Error('EventController - remove: eventId required')

		const result = await Event.remove({ _id: eventId });
	},

	async checkEvents() {
		return new Promise((resolve, reject) => {

			pubClient.hgetall('symbols', async (err, symbols) => {
				if (err)
					return reject(err);

				if (!symbols)
					return resolve();

				for (let key in symbols) {
					let symbol = JSON.parse(symbols[key]);

					// if (symbol.name === 'BTC') {
					// 	console.log(symbol);
					// }
				
					// HIGH / LOW MUST BE SET (otherwise all alarms trigger)
					if (!symbol.highM || !symbol.lowM)
						continue;

					let events = <any>flatten(await Promise.all(
						[
							Event.find({ triggered: false, symbol: symbol.name, 'alarm.dir': ALARM_TRIGGER_DIRECTION_UP, 'alarm.price': { $lt: symbol.highM } }),
							Event.find({ triggered: false, symbol: symbol.name, 'alarm.dir': ALARM_TRIGGER_DIRECTION_DOWN, 'alarm.price': { $gt: symbol.lowM } }),
						]
					));

					if (events.length) {

						for (let k = 0, lenk = events.length; k < lenk; k++) {
							const event = events[k];
							event.triggered = true;
							event.triggeredDate = new Date();
							event.save();

							// notify
							// if (parent.userId.toString() !== reqUser.id) {
							let pubOptions = {
								type: 'symbol-alarm',
								toUserId: event.userId,
								fromUserId: event.userId,
								data: {
									eventId: event._id,
									time: event.triggeredDate,
									symbol: event.symbol,
									target: event.alarm.price
								}
							};

							pubClient.publish("notify", JSON.stringify(pubOptions), (error) => {
								if (error)
									console.error(error);
							});
						}
					}
				}

				resolve();
			});
		});
	}
};