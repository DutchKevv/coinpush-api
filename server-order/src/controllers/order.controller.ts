
import {Order} from '../schemas/order';
import {
	BROKER_ERROR_INVALID_ARGUMENT, BROKER_ERROR_MARKET_CLOSED, BROKER_ERROR_UNKNOWN, BROKER_OANDA_ERROR_INVALID_ARGUMENT,
	BROKER_OANDA_ERROR_MARKET_CLOSED
} from '../../../shared/constants/constants';

export const orderController = {

	find() {

	},

	findById(id) {
		return Order.findById(id);
	},

	async findByUserId(userId) {
		return Order.find({user: userId}).limit(50);
	},

	async create(params) {
		try {
			Object.assign(params, await global['brokerAPI'].placeOrder(params));
		} catch (error) {
			console.error(error);

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
					throw ({
						code: BROKER_ERROR_UNKNOWN,
						error: 'undocumented error occurred'
					});
			}
		}

		return await Order.create(params);
	},

	update() {

	},

	remove() {

	}
};