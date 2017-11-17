import EA from '../../../server/classes/ea/EA';
import {IEA} from 'tradejs/ea';
import {IOrder} from '../../../server/modules/order/OrderManager';

export default class MyEA extends EA implements IEA {

	count = 0;
	MA1: any;
	MA2: any;
	MA3: any;
	MA4: any;
	
	
	public async onInit(): Promise<any> {

		this.MA1 = this.addIndicator('MA', {
			color: 'yellow',
			period: 30
		});

		this.MA2 = this.addIndicator('MA', {
			color: 'red',
			period: 20
		});

		this.MA3 = this.addIndicator('MA', {
			color: 'purple',
			period: 10
		});

		this.MA4 = this.addIndicator('MA', {
			color: 'orange',
			period: 50
		});
	}

	public async onTick(time: number, bid: number, ask: number): Promise<void> {
		let hasOrders = !!this.orderManager.orders.length;
		await this.checkOrders();

		if (hasOrders)
			return;

		if (bid > this.MA1.value * 1.001 && !this.orderManager.orders.length) {

				try {
					// Place order
					let id = await this.addOrder({
						instrument: this.symbol,
						count: 2000,
						type: 'sell',
						openBid: bid,
						openAsk: ask
					});
				} catch (error) {
				}
		}

		else if (bid < this.MA1.value * 0.999 && !this.orderManager.orders.length) {

			try {
				// Place order
				let id = await this.addOrder({
					instrument: this.symbol,
					count: 2000,
					type: 'buy',
					openBid: bid,
					openAsk: ask
				});
			} catch (error) {
			}
		}


// 		await new Promise((resolve, reject) => {
// 			setTimeout(() => {
// 				resolve();
// 			}, 1)
// 		});
	}

	async checkOrders() {
		return Promise.all(this.orderManager.orders.map((order: IOrder) => {
			return Promise.resolve().then(async () => {
				if (order.type === 'buy') {
					if (this.bid > this.MA1.value) {
						await this.closeOrder(order.id, this.bid, this.ask);
					}
				} else {
					if (this.bid < this.MA1.value) {
						await this.closeOrder(order.id, this.bid, this.ask);
					}
				}
			});
		}));
	}
}