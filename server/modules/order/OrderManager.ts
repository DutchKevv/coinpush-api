import AccountManager from '../account/AccountManager';
import {Base} from '../../../shared/classes/Base';
import {remove} from 'lodash';

export interface IOrder {
	symbol: string;
	count: number;
	side: string;
	id?: number | string;
	openBid?: number;
	openAsk?: number;
	closeBid?: number;
	closeAsk?: number;
	takeProfit?: number;
	takeLoss?: number;
	openTime?: number;
	closeTime?: number;
	profit?: number;
	closeValue?: number;
	openEquality?: number;
	closeEquality?: number;

}

export default class OrderManager extends Base {

	static ERROR_NOT_ENOUGH_FUNDS = 1;

	private _orders = [];
	private _closedOrders = [];
	private _unique = 0;

	public get orders() {
		return this._orders;
	}

	public get closedOrders() {
		return this._closedOrders;
	}

	constructor(private _accountManager: AccountManager,
				protected __options?) {
		super(__options)
	}

	public async init() {
	}

	public async add(order: IOrder) {
		// TODO: Debug warning 'Not enough funds'
		let orderPrice = this._calculateOrderPrice(order);

		if (this._accountManager.equality < orderPrice) {

			this.options.ipc.send('main', 'debug', {
				type: 'error',
				code: OrderManager.ERROR_NOT_ENOUGH_FUNDS,
				text: 'Not enough funds'
			}, false);

			throw ({code: OrderManager.ERROR_NOT_ENOUGH_FUNDS});
		}

		order.id = this._unique++;

		if (this.options.live) {

		} else {
			this._accountManager.addEquality(-orderPrice);
			order.openEquality = this._accountManager.equality;
			this._orders.push(order);

			this.emit('order', order)
		}

		return order.id;
	}

	public findByDateRange(from: number, until: number) {
		return this._closedOrders.filter((order: IOrder) => order.openTime >= from && order.openTime <= until);
	}

	public findById(id): IOrder {
		return this.orders.find(order => order.id === id);
	}

	public close(time, id: number, bid: number, ask: number) {
		let order = this.findById(id);

		// Remove from list
		this._orders.splice(this._orders.findIndex(_order => _order.id === id), 1);

		// TODO: Debug warning 'Order not found)
		if (!order) {
			return false;
		}

		// TODO: Send to broker
		if (this.options.live) {

		} else {
			order.closeTime = time || Date.now();
			order.closeBid = bid;
			order.closeAsk = ask;
			let {value, profit} = this.getValue(order, bid, ask);

			order.closeValue = value;
			order.profit = profit;

			this._accountManager.addEquality(order.closeValue);
			order.closeEquality = this._accountManager.equality;
			this._closedOrders.push(order);
		}
	}

	public closeAll(time, bid, ask) {
		this.orders.forEach(order => this.close(time, order.id, bid, ask));
	}

	public update() {

	}

	public tick() {

	}

	public getValue(order: IOrder, bid: number, ask: number) {
		let value, profit;

		if (order.side === 'buy') {
			value = bid * order.count;
			profit = (bid - order.openBid) * order.count;
		} else {

			profit = (order.openBid - ask) * order.count;
			value = (order.openBid * order.count) + profit
		}

		console.log(order.side, order.openBid, bid, profit);

		profit = parseFloat(profit.toFixed(2));

		return {value, profit};
	}

	public getOpenOrdersValue(bid, ask) {
		let total = 0;

		this._orders.forEach(order => {
			total += this.getValue(order, bid, ask).value;
		});

		return total
	}

	private _calculateOrderPrice(order: IOrder): number {
		return order.count * (order.side === 'sell' ? order.openBid : order.openAsk);
	}
}