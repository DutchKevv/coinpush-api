import Instrument from '../instrument/Instrument';
import OrderManager from '../../modules/order/OrderManager';
import AccountManager from '../../modules/account/AccountManager';
import {winston} from '../../logger';

export interface IEA {
	orderManager: OrderManager;
	onTick(timestamp, bid, ask): Promise<any>|void;
}

export default class EA extends Instrument implements IEA {

	public accountManager: AccountManager;
	public orderManager: OrderManager;

	private _lastReportTime = 0;

	constructor(...args) {
		super(args[0], args[1]);
	}

	public async init() {
		await super.init();

		this.accountManager = new AccountManager({
			equality: this.options.startEquality
		});

		this.orderManager = new OrderManager(this.accountManager, {
			live: this.options.type === 'live',
			ipc: this.ipc
		});

		await this.accountManager.init();
		await this.orderManager.init();

		this.ipc.on('@run', opt => this.runBackTest());

		await this.onInit();

		this.set({status: {type: 'idle'}});

		if (this.options.autoRun)
			this.runBackTest();
	}

	async tick(timestamp, bid, ask): Promise<void> {
		await super.tick(timestamp, bid, ask);

		if (this.options.type === 'backtest') {
			this.orderManager.tick()
		}

		await this.onTick(timestamp, bid, ask);
	}

	public onTick(timestamp, bid, ask) {
		console.log('CUSTOM [onTick] SHOULD BE CALLED')
	}

	public async onInit() {}

	protected async addOrder(orderOptions) {
		let result = this.orderManager.add(Object.assign(orderOptions, {openTime: this.time}));

		return result;
	}

	protected closeOrder(id, bid, ask) {
		this.orderManager.close(this.time, id, bid, ask)
	}

	protected closeAllOrders(id, bid, ask) {
		this.orderManager.close(this.time, id, bid, ask)
	}

	async runBackTest(): Promise<any> {
		let count = 1000,
			lastTime, lastBatch = false,
			from = this.options.from,
			until = this.options.until;

		this.model.set({status: {
			type: 'fetching',
			startTime: Date.now()
		}});

		let p = this.ipc.send('cache', 'read', {
			symbol: this.symbol,
			timeFrame: this.timeFrame,
			from: from,
			count: count
		});

		// Report status every X seconds
		// TODO - Optimize
		let now = Date.now();
		let interval = setInterval(() => {
			this._emitProgressReport();
			now = Date.now();
		}, 1000);

		this._emitProgressReport();

		while (true) {
			let candles = await p;

			this.model.set({status: {type: 'running'}});

			// There is no more data, so stop
			if (!candles || !candles.length) {
				winston.warn('Empty buffer received from read!', from, until);
				break;
			}

			from = candles.readDoubleLE(candles.length - (10 * Float64Array.BYTES_PER_ELEMENT));

			if (from < until) {
				p = this.ipc.send('cache', 'read', {
					symbol: this.symbol,
					timeFrame: this.timeFrame,
					from: from,
					count: count
				});
			}

			let ticks = new Float64Array(Buffer.from(candles).buffer);

			// See if until is reached in this batch
			if (from > until) {

				// Loop to find index of last candle
				for (let i = 0, len = ticks.length; i < len; i += 10) {
					if (ticks[i] >= until) {
						ticks = ticks.slice(0, i);
						lastBatch = true;
						break;
					}
				}
			}

			await this.inject(ticks);

			this.model.set({status: {type: 'fetching'}});

			// There are no more candles to end
			if (lastBatch || ticks.length < count)
				break;
		}

		clearInterval(interval);

		this.orderManager.closeAll(lastTime, this.bid, this.ask);

		this.model.set({status: {
			endTime: Date.now(),
			type: 'finished',
			progress: 100
		}});

		this._emitProgressReport();

		this.ipc.send('main', '@run:end', undefined, false);
	}

	private _emitProgressReport() {
		this.updateTicksPerSecond();
		this.model.options.status.progress = (((this.time - this.options.from) / (this.options.until - this.options.from)) * 100).toFixed(2);

		this.ipc.send('main', 'instrument:status', {
			id: this.id,
			equality: (this.accountManager.equality + this.orderManager.getOpenOrdersValue(this.bid, this.ask)).toFixed(2),
			orders: this.orderManager.findByDateRange(this._lastReportTime, this.time),
			lastTime: this.time,
			status: this.model.options.status
		}, false);

		this._lastReportTime = this.time;
	}
}