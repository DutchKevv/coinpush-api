import * as url from 'url';
import * as request from 'request-promise';
import * as redis from '../modules/redis';
import {Order} from '../schemas/order';
import {
	BROKER_ERROR_INVALID_ARGUMENT, BROKER_ERROR_MARKET_CLOSED, BROKER_ERROR_UNKNOWN,
	BROKER_OANDA_ERROR_INVALID_ARGUMENT,
	BROKER_OANDA_ERROR_MARKET_CLOSED, BROKER_OANDA_ERROR_TRADE_NOT_FOUND, REDIS_USER_PREFIX
} from '../../../shared/constants/constants';
import OandaApi from '../../../shared/brokers/oanda/index';
import {Status} from "../schemas/status";

const config = require('../../../tradejs.config');

export const orderController = {

	_brokerAPI: new OandaApi(config.broker.account),

	async init() {
		this._brokerAPI.init();

		this._brokerAPI.subscribeEventStream(event => this._onBrokerEvent(event).catch(console.error));

		await this.syncOrders();
	},

	find(reqUser) {

	},

	findById(reqUser, id: string) {
		return Order.findById(id);
	},

	findByBrokerId(reqUser, brokerId: string) {
		return Order.findOne({b_id: brokerId});
	},

	findOpenOnBroker(reqUser) {
		return this._brokerAPI.getOpenOrders();
	},

	async findByUserId(reqUser, userId: string, closed = false) {
		return Order.find({user: userId, closed}).limit(50);
	},

	async create(params) {
		try {

			// Create a new broker class
			// TODO : Refactor
			const broker = new OandaApi({
				// accountId: user.brokerAccountId,
				// token: user.brokerToken
				accountId: config.broker.account.accountId,
				token: config.broker.account.token
			});

			await broker.init();

			// Place order and merge result
			Object.assign(params, await broker.placeOrder(params));

			// Create order model from result
			const order = await Order.create(params);

			redis.client.publish('order-created', JSON.stringify(order));

			return order;

		} catch (error) {
			console.error('ORDER CREATE : ', error);

			switch (error.code) {
				case BROKER_OANDA_ERROR_INVALID_ARGUMENT:
					throw ({
						code: BROKER_ERROR_INVALID_ARGUMENT,
						message: 'Invalid argument in http request '
					});
				case BROKER_OANDA_ERROR_MARKET_CLOSED:
					throw ({
						code: BROKER_ERROR_MARKET_CLOSED,
						message: 'Market closed'
					});
				default:
					console.error(error);
					throw ({
						code: BROKER_ERROR_UNKNOWN,
						error: 'undocumented error occurred'
					});
			}
		}
	},

	async update(reqUser, orderId: string, brokerId: number, params: any) {
		let result;

		if (orderId)
			result = await Order.update({_id: orderId}, params);
		else
			result = await Order.update({b_id: brokerId}, params);

		console.log('update result', result);
	},

	async close(reqUser, orderId) {
		let order;

		try {
			order = await this.findById(reqUser, orderId);

			const result = await this._brokerAPI.closeOrder(order.b_id);

			redis.client.publish('order-closed', JSON.stringify({id: orderId}));

			return true;
		} catch (error) {
			console.error('ORDER CLOSE : ', error);

			switch (error.code) {
				case BROKER_OANDA_ERROR_TRADE_NOT_FOUND:
					if (order) {
						order.closed = true;
						await order.save();
					}
					break;
				case BROKER_OANDA_ERROR_INVALID_ARGUMENT:
					throw ({
						code: BROKER_ERROR_INVALID_ARGUMENT,
						message: 'Invalid argument in http request '
					});
				case BROKER_OANDA_ERROR_MARKET_CLOSED:
					throw ({
						code: BROKER_ERROR_MARKET_CLOSED,
						message: 'Market closed'
					});
				default:
					console.error(error);
					throw ({
						code: BROKER_ERROR_UNKNOWN,
						error: 'undocumented error occurred'
					});
			}
		}
	},

	async closeByBrokerId(reqUser, brokerId) {

	},

	async getCached(userId, fields) {
		return new Promise((resolve, reject) => {
			redis.client.get(REDIS_USER_PREFIX + userId, function (err, reply) {
				if (err)
					reject(err);
				else
					resolve(JSON.parse(reply))
			});
		});
	},

	async syncOrders() {
		// get current status
		let status = await this._getStatus();
		console.log(status);
		while (true) {
			// get all transactions after last synced id
			const transactions = await this._brokerAPI.getTransactionHistory(status.lastSync);

			if (!transactions.length)
				break;

			for (let i = 0; i < transactions.length; i++) {
				const transaction = transactions[i];

				// first one is always included by Oanda
				if (transaction.id === status.lastSync)
					continue;

				await this._onBrokerEvent({transaction}, false);
			}

			// update last synced id in DB
			status.lastSync = transactions[transactions.length - 1].id;
			await status.save();
		}
	},

	async _getStatus() {
		let status = await Status.findOne();

		if (!status)
			status = await Status.create({lastSync: 1});

		return status;
	},

	async _onBrokerEvent(event, updateLastSync = true) {
		console.log('EVENTSDF', event.transaction);
		// handle action
		if (event.transaction) {
			let transaction = event.transaction;

			switch (transaction.type) {
				case 'TRADE_CLOSE':
					await this.update({}, null, transaction.tradeId, {
						closed: true,
						profit: transaction.pl,
						interest: transaction.interest,
						closeTime: transaction.time,
						closePrice: transaction.price
					});
					break;
				case 'MARKET_ORDER_CREATE':
					break;
				case 'DAILY_INTEREST':
					console.log('interest', transaction);
					await this.update({}, event.id, {interest: transaction.interest});
					break;
				default:
					throw({code: 9999, message: 'unknown order broker event type'});

			}

			if (updateLastSync)
				await Status.update({}, {lastSync: event.transaction.id});
		}
	}
};