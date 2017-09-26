import * as request from 'request-promise';
import {BROKER_ERROR_NOT_ENOUGH_FUNDS, CHANNEL_TYPE_MAIN} from '../../../shared/constants/constants';
import {userController} from './user.controller';
import * as redis from '../modules/redis';

const config = require('../../../tradejs.config');

export const orderController = {

	find(params): Promise<Array<any>> {
		return Promise.resolve([]);
	},

	async create(reqUser: {id: string}, params, triggerCopy = true) {

		let balance =  await userController.getBalance(reqUser, reqUser.id),
			requiredAmount = params.amount * (await this._getCurrentPrice(params.symbol)).bid;

		// check balance
		if (balance < requiredAmount)
			throw {
				code: BROKER_ERROR_NOT_ENOUGH_FUNDS,
				message: 'Not enough funds'
			};

		// send request to order service
		const order = await request({
			uri: config.server.order.apiUrl + '/order',
			method: 'POST',
			headers: {'_id': reqUser.id},
			body: params,
			json: true
		});

		const updateResult = await userController.updateBalance(reqUser, {amount: -(order.openPrice * order.amount)});
		order.balance = updateResult.balance;

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
	},

	_getCurrentPrice(symbolName) {
		return new Promise((resolve, reject) => {
			redis.client.get('symbol-' + symbolName, (err, symbol) => {
				if (err)
					return reject(err);

				resolve(JSON.parse(symbol));
			});
		});
	}
};