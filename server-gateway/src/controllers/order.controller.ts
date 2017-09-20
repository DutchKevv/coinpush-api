import * as url from 'url';
import * as request from 'request-promise';
import * as redis from '../modules/redis';
import {CHANNEL_TYPE_MAIN} from '../../../shared/constants/constants';
import {OrderModel} from '../../../shared/models/OrderModel';

const config = require('../../../tradejs.config');

export const orderController = {

	find(params): Promise<Array<any>> {
		return Promise.resolve([]);
	},

	async create(reqUser: {id: string}, params, triggerCopy = true) {

		const order = await request({
			uri: config.server.order.apiUrl + '/order',
			method: 'POST',
			headers: {'_id': reqUser.id},
			body: params,
			json: true
		});

		if (triggerCopy)
			this._copyOrder(order).catch(console.error);

		return order;
	},

	update(userId, params) {

	},

	async _copyOrder(order): Promise<Boolean> {

		try {
			// Get user MAIN channel
			const copiers = (await request({
				uri: config.server.channel.apiUrl + '/channel/',
				method: 'GET',
				headers: {'_id': order.user},
				qs: {
					fields: ['_id, copiers'],
					user: order.user,
					type: CHANNEL_TYPE_MAIN
				},
				json: true
			})).user[0].copiers;

			copiers.forEach(copier => {
				this.create({id: copier}, order, false).catch(console.error);
			});
		} catch (error) {
			console.error(error);
			return false;
		}

		return true;
	}
};