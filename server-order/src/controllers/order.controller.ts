import * as url from 'url';
import * as request from 'request-promise';
import * as redis from '../modules/redis';
import {Order} from '../schemas/order';
import {
	BROKER_ERROR_INVALID_ARGUMENT, BROKER_ERROR_MARKET_CLOSED, BROKER_ERROR_UNKNOWN, BROKER_OANDA_ERROR_INVALID_ARGUMENT,
	BROKER_OANDA_ERROR_MARKET_CLOSED, REDIS_USER_PREFIX
} from '../../../shared/constants/constants';
import OandaApi from '../../../shared/brokers/oanda/index';

const config = require('../../../tradejs.config');

export const orderController = {

	_brokerAPI: new OandaApi(config.broker.account),

	async init() {
		await this._brokerAPI.init();

		this._brokerAPI.subscribeEventStream(event => {
			console.log(event);
		});
	},

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
			await broker.closeOrder(orderId);

			redis.client.publish('order-closed', JSON.stringify({id: orderId}));

			return true;
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

	_onBrokerEvent(event) {

		if (event.transaction) {
			var transaction = {
				"transaction": {
					"id": 10001,
					"accountId": 12345,
					"time": "2014-05-26T13:58:41.000000Z",
					"type": "MARGIN_CLOSEOUT",
					"instrument": "EUR_USD",
					"units": 10,
					"side": "sell",
					"price": 1,
					"pl": 1.234,
					"interest": 0.034,
					"accountBalance": 10000,
					"tradeId": 1359
				}
			}
		}

		if (event.disconnected) {
			var disconnected = {
				"disconnect": {
					"code": 60,
					"message": "Access Token connection limit exceeded: This connection will now be disconnected",
					"moreInfo": "http:\/\/developer.oanda.com\/docs\/v1\/troubleshooting"
				}
			}
		}
	}
};