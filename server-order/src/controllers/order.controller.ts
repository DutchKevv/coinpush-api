import * as url from 'url';
import * as request from 'request-promise';
import * as redis from '../modules/redis';
import {Order} from '../schemas/order';
import {
	BROKER_ERROR_INVALID_ARGUMENT, BROKER_ERROR_MARKET_CLOSED, BROKER_ERROR_UNKNOWN, BROKER_OANDA_ERROR_INVALID_ARGUMENT,
	BROKER_OANDA_ERROR_MARKET_CLOSED, REDIS_USER_PREFIX, USER_FETCH_TYPE_BROKER_DETAILS
} from '../../../shared/constants/constants';
import OandaApi from '../../../shared/brokers/oanda/index';

const config = require('../../../tradejs.config');

export const orderController = {

	find(reqUser) {

	},

	findById(reqUser, id: string) {
		return Order.findById(id);
	},

	async findByUserId(reqUser, userId: string) {
		return Order.find({user: userId}).limit(50);
	},

	async create(params) {
		try {
			// Get user that created order
			const user = await this._getUser(params.user);

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

	update() {

	},

	async close(reqUser, orderId) {
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
			await broker.closeOrder(tradeId);

			redis.client.publish('order-closed', JSON.stringify(order));

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

	async _getUser(userId) {
		try {
			return await this.getCached(userId);
		} catch (error) {
			console.error(error);
		}

		return await request({
			uri: url.resolve(config.server.social.apiUrl, 'social/user/' + userId),
			qs: {
				type: USER_FETCH_TYPE_BROKER_DETAILS
			},
			json: true
		});
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
};