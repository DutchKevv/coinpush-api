import * as mongoose from 'mongoose';
import {orderController} from "../controllers/order.controller";
const config = require('../../../tradejs.config');

const db = mongoose.connection;
mongoose.Promise = global.Promise;
mongoose.connect(config.server.order.connectionString);

module.exports = {

	async closeAllOrders() {
		await orderController.init(false);


		while (true) {
			const orders = await orderController.findOpenOnBroker({id: null});

			if (orders.length === 0)
				break;

			for (let i = 0; i < orders.length; i++) {
				try {
					console.log(orders[i].id);
					const result = await orderController.close({}, null, orders[i].id);

					console.log(result);
				} catch (error) {
					console.error(error);
				}
			}
		}
	},

	async addFakeFollowersAndCopiers(min = 0, max = 10) {

	}
};

module.exports.closeAllOrders().then(() => process.exit(0)).catch(console.error);