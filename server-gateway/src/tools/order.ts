import {orderController} from "../controllers/order.controller";

module.exports = {

	async closeAllOrders() {
		const orders = await orderController.getAllOpen({id: 0});

		for (let i = 0; i < orders.length; i++) {
			const order = orderController.findByBrokerId({}, orders[i].id);

			if (!order) {
				console.log('order not found!');
				continue;
			}

			await orderController.close({}, orders[i].id);
		}
	},

	async addFakeFollowersAndCopiers(min = 0, max = 10) {

	}
};

module.exports.closeAllOrders().then(() => process.exit(0)).catch(console.error);