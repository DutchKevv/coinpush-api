import * as url from 'url';
import * as request from 'request-promise';
import * as redis from '../modules/redis';
import {Order} from '../schemas/order';
import {
	BROKER_ERROR_INVALID_ARGUMENT, BROKER_ERROR_MARKET_CLOSED, BROKER_ERROR_UNKNOWN, BROKER_OANDA_ERROR_INVALID_ARGUMENT,
	BROKER_OANDA_ERROR_MARKET_CLOSED, USER_FETCH_TYPE_BROKER_DETAILS
} from '../../../shared/constants/constants';
import OandaApi from '../../../shared/brokers/oanda/index';

const config = require('../../../tradejs.config');

export const orderController = {

	brokers: {
		oanda: global['brokerAPI']
	},

	find() {

	},

	findById(id: string) {
		return Order.findById(id);
	},

	async findByUserId(userId: string) {
		return Order.find({user: userId}).limit(50);
	},

	async create(params) {
		try {
			// Get user that created order
			const user = JSON.parse(await this._getUser(params.user));

			// Create a new broker class
			// TODO : Refactor
			const broker = new OandaApi({
				accountId: user.brokerAccountId,
				token: user.brokerToken
			});

			await broker.init();

			console.log('11111111');
			// Place order and merge result
			Object.assign(params, await broker.placeOrder(params));
			console.log('22222222222');
			// Create order model from result
			const order = await Order.create(params);
			console.log('3333333333');
			console.log('DATABASE ORDER', order);

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

	createForFollowers(followers) {
		Promise.resolve().then(() => {

		}).catch(error => {

		});
	},

	update() {

	},

	remove() {

	},

	async _getUser(id) {
		let user = await this.getCached();

		if (user)
			return user;

		return await request({
			uri: url.resolve(config.server.social.apiUrl, 'social/user/' + id),
			qs: {
				type: USER_FETCH_TYPE_BROKER_DETAILS
			}
		});
	},

	async getCached(key, fields) {
		return new Promise((resolve, reject) => {
			redis.client.get(key, function (err, reply) {
				if (err)
					reject(err);
				else
					resolve(JSON.parse(reply))
			});
		});
	},
};