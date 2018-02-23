import * as request from 'request-promise';
import {BROKER_ERROR_NOT_ENOUGH_FUNDS} from 'coinpush/constant';
import {userController} from './user.controller';

const config = require('../../../tradejs.config');

export const orderController = {

	async find(reqUser, orderId: string): Promise<Array<any>> {
		const order = await request({
			uri: config.server.order.apiUrl + '/order/' + orderId,
			headers: {'_id': reqUser.id},
			json: true
		});

		return order;
	},

	async findByBrokerId(reqUser, brokerId): Promise<Array<any>> {
		const order = await request({
			uri: config.server.order.apiUrl + '/order/' + brokerId,
			headers: {'_id': reqUser.id},
			qs: {
				type: 'broker'
			},
			json: true
		});

		return order;
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

		console.log('ORDER ORDER', order);

		const updateResult = await userController.updateBalance(reqUser, {amount: -(order.openPrice * order.amount)});
		order.balance = updateResult.balance;

		if (triggerCopy)
			this._copyOrder(order).catch(console.error);

		return order;
	},

	update(userId, params) {

	},

	async close(reqUser, orderId: string) {
		const result = await request({
			uri: config.server.order.apiUrl + '/order/' + orderId,
			method: 'delete',
			headers: {'_id': reqUser.id},
			json: true
		});

		return result;
	},

	async getAllOpen(reqUser): Promise<Array<any>> {
		const orders = await request({
			uri: config.server.order.apiUrl + '/order/',
			method: 'GET',
			headers: {'_id': reqUser.id},
			qs: {
				broker: true
			},
			json: true
		});

		console.log('open', orders);

		return orders;
	},

	async _copyOrder(order): Promise<Boolean> {
		return true;
	}
};