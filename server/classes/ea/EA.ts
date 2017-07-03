import Instrument        from '../instrument/Instrument';
import OrderManager    from '../../modules/order/OrderManager';
import AccountManager    from '../../modules/account/AccountManager';
import {log}            from '../../../shared/logger';

export interface IEA {
	orderManager: OrderManager;
	onTick(timestamp, bid, ask): Promise<any> | void;
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

		this.orderManager.on('order', order => {
			this.model.options.status.equality = +(this.accountManager.equality + this.orderManager.getOpenOrdersValue(this.bid, this.ask)).toFixed(2);
		});

		await this.accountManager.init();
		await this.orderManager.init();

		this.ipc.on('@run', opt => this.runBackTest());

		await this.onInit();

		this.model.set({status: {type: 'idle'}});

		if (this.model.options.autoRun)
			this.runBackTest();
	}

	async tick(timestamp, bid, ask): Promise<void> {
		await super.tick(timestamp, bid, ask);

		if (!this.model.options.from || this.model.options.from <= timestamp) {

			if (this.options.type === 'backtest') {
				this.orderManager.tick()
			}

			await this.onTick(timestamp, bid, ask);
		}
	}

	public onTick(timestamp, bid, ask) {
		console.log('CUSTOM [onTick] SHOULD BE CALLED')
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
		log.info('EA', `${this.id} : Starting Backtest`);

		let count = 1000,
			lastBatch = false,
			from = this.options.from,
			until = this.options.until,
			startFetch = Date.now();

		this.model.set({
			status: {
				type: 'fetching',
				startTime: Date.now()
			}
		});

		let p = this.ipc.sendAsync('cache', 'read', {
			symbol: this.symbol,
			timeFrame: this.timeFrame,
			from: from,
			count: count
		});

		// Report status every X seconds
		// TODO - Optimize
		let interval = setInterval(() => this._emitProgressReport(), 1000);

		this._emitProgressReport();

		while (true) {
			let candles = await p;

			this.model.set({
				status: {
					type: 'running',
					fetchTime: this.model.options.status.fetchTime + (Date.now() - startFetch)
				}
			});

			// There is no more data, so stop
			if (!candles || !candles.length) {
				log.warn('EA', `Empty buffer received from read! ${from} ${until}`);
				break;
			}

			from = candles.readDoubleLE(candles.length - (10 * Float64Array.BYTES_PER_ELEMENT));

			if (from < until) {
				p = this.ipc.sendAsync('cache', 'read', {
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

			startFetch = Date.now();
			this.model.set({status: {type: 'fetching'}});

			// There are no more candles to end
			if (lastBatch || ticks.length < count)
				break;
		}

		clearInterval(interval);

		this.orderManager.closeAll(this.time, this.bid, this.ask);

		this.model.set({
			status: {
				type: 'finished',
				endTime: Date.now()
			}
		});

		this._emitProgressReport();
	}

	private _emitProgressReport() {
		this.updateTicksPerSecond();

		let progress = +(((this.time - this.options.from) / (this.options.until - this.options.from)) * 100).toFixed(2);
		this.model.options.status.progress = progress;

		this.ipc.send('main', 'instrument:status', {
			id: this.id,
			orders: this.orderManager.findByDateRange(this._lastReportTime, this.time),
			lastTime: this.time,
			status: this.model.options.status
		});

		this._lastReportTime = this.time;
	}
}