import * as url from 'url';
import * as request from 'request-promise';
import * as redis from '../modules/redis';
import {Order} from '../schemas/order';
import {
	BROKER_ERROR_INVALID_ARGUMENT, BROKER_ERROR_MARKET_CLOSED, BROKER_ERROR_UNKNOWN, BROKER_OANDA_ERROR_INVALID_ARGUMENT,
	BROKER_OANDA_ERROR_MARKET_CLOSED
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