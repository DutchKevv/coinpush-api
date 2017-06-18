import Instrument from '../instrument/Instrument';
import OrderManager from '../../modules/order/OrderManager';
import AccountManager from '../../modules/account/AccountManager';
import {winston} from '../../logger';

export interface IEA {
	orderManager: OrderManager;
	onTick(timestamp, bid, ask): Promise<any>|void;
}

export default class EA extends Instrument implements IEA {

	public tickCount = 0;
	public status = 'booting';
	public statusValue = 0;

	public accountManager: AccountManager;
	public orderManager: OrderManager;

	private _lastReportTime = 0;

	private _backtestData = {
		totalFetchTime: 0,
		startTime: null,
		endTime: null
	};

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
		this.ipc.on('@report', (data, cb) => cb(null, this.report()));

		await this.onInit();

		this.status = 'idle';

		if (this.options.autoRun)
			this.runBackTest();
	}

	public report() {
		return {
			id: this.id,
			tickCount: this.tickCount,
			equality: this.accountManager.equality + this.orderManager.getOpenOrdersValue(this.bid, this.ask),
			orders: this.orderManager.closedOrders,
			data: this._backtestData,
			lastTime: this.time
		};
	}

	async tick(timestamp, bid, ask): Promise<void> {
		await super.tick(timestamp, bid, ask);

		if (this.options.type === 'backtest') {
			this.orderManager.tick()
		}

		await this.onTick(timestamp, bid, ask);
	}

	public onTick(timestamp, bid, ask) {
		console.log('CUSTOM ONTICK SHOULD BE CALLED')
	}

	public async onInit() {
	}

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
			candles, lastTime, lastBatch = false,
			from = this.options.from,
			until = this.options.until;

		this.status = 'fetching';

		let p = this.ipc.send('cache', 'read', {
			symbol: this.symbol,
			timeFrame: this.timeFrame,
			from: from,
			count: count
		}).then(_candles => {this._backtestData.startTime = Date.now(); return _candles; });

		// Report status every X seconds
		// TODO - Optimize
		let now = Date.now();
		let interval = setInterval(() => {
			this._emitProgressReport();
			console.log('TIME PASSED!!!  :  ', Date.now() - now);
			now = Date.now();
		}, 500);

		this._emitProgressReport();

		while (true) {
			candles = await p;

			this.status = 'running';

			// There is no more data, so stop
			if (!candles.length) {
				winston.warn('Empty buffer received from read!', from, until);
				break;
			}

			from = candles.readDoubleLE(candles.length - (10 * Float64Array.BYTES_PER_ELEMENT)) + 1;

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

			this.status = 'fetching';

			// There are no more candles to end
			if (lastBatch || ticks.length < count)
				break;
		}

		clearInterval(interval);

		this.orderManager.closeAll(lastTime, this.bid, this.ask);
		this._backtestData.endTime = Date.now();
		this.status = 'finished';

		this._emitProgressReport();

		this.ipc.send('main', '@run:end', undefined, false);
	}

	private _emitProgressReport() {
		let totalTime = (this.options.endTime || Date.now()) - this.get('startTime'),
			now = Date.now();

		this.ipc.send('main', 'instrument:status', {
			id: this.id,
			tickCount: this.tickCount,
			ticksPerSecond: Math.ceil(this.tickCount / ((this.time - this._backtestData.startTime) / 1000)),
			equality: (this.accountManager.equality + this.orderManager.getOpenOrdersValue(this.bid, this.ask)).toFixed(2),
			orders: this.orderManager.findByDateRange(this._lastReportTime, this.time),
			data: this._backtestData,
			lastTime: this.time,
			status: {
				type: this.status,
				value: (((this.time - this.options.from) / (this.options.until - this.options.from)) * 100).toFixed(2)
			}
		}, false);

		this._lastReportTime = this.time;
	}
}