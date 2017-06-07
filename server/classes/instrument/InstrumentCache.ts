import WorkerChild 	from '../worker/WorkerChild';
import CacheMapper 	from '../cache/CacheMap';
import * as winston	from 'winston-color';

export default class InstrumentCache extends WorkerChild {

	public instrument: string = this.opt.instrument;
	public timeFrame: string = this.opt.timeFrame;

	protected tickCount = 0;
	protected ticks: any = [];

	protected time: number;
	protected bid: number;
	protected ask: number;

	protected from: number;
	protected until: number;

	private _map: CacheMapper = new CacheMapper();
	private _readyHandler = Promise.resolve();

	public async init() {
		await super.init();

		await this._ipc.connectTo('cache');
		await this._doPreFetch();

		if (this.options.live) {
			await this._toggleNewTickListener(true);
		}
	}

	public tick(timestamp, bid, ask) {
		console.log('super tick function, you should define one in your class!');
	}

	public read(count = 0, offset = 0, start?: number, until?: number) {
		return this._readyHandler.then(async () => {

			let candles = this.ticks.slice(this.ticks.length - count - offset, this.ticks.length - offset);
			return candles;
		});
	}

	private async _doPreFetch() {

		let buf = await this._ipc.send('cache', 'read', {
				instrument: this.instrument,
				timeFrame: this.timeFrame,
				until: this.options.live ? this.options.until :  this.options.from,
				count: 500
			});

		let _buf = new Buffer(buf);
		let ticks = new Float64Array(_buf.buffer);

		await this._doTickLoop(ticks, false);
	}

	private async _doTickLoop(candles, tick = true) {

		if (!candles.length)
			return;

		this._map.update(this.instrument, this.timeFrame, candles[0], candles[candles.length - 10], candles.length);

		let i = 0;
		while (i < candles.length) {
			let candle = candles.slice(i, i = i + 10);

			// Quality check, make sure every tick has a timestamp AFTER the previous tick
			// (Just to be sure)
			if (this.ticks.length && this.ticks[this.ticks.length - 1][0] >= candle[0]) {
				console.log('TIME STAMP DIFF', this.ticks[this.ticks.length - 1][0], candle[0], 'TICK COUNT', this.ticks.length);
				throw new Error('Candle timestamp is not after previous timestamp');
			}

			if (candle.length !== 10) {
				throw new Error(`Illegal candle length: ${candle.length} Should be 10`);
			}

			this.ticks.push(candle);

			if (tick) {
				++this.tickCount;

				this.time = candle[0];
				this.bid = candle[1];
				this.ask = candle[2];

				await this.tick(candle[0], candle[1], candle[2]);
			}
		}
	}

	protected inject(candles) {
		return this._doTickLoop(candles);
	}

	private async _toggleNewTickListener(state: boolean) {
		if (state) {
			await this._ipc.send('cache', 'register', {id: this.id, instrument: this.instrument}, true);
		} else {
			await this._ipc.send('cache', 'unregister', {id: this.id, instrument: this.instrument}, true);
			// this.listenForNewTick = false;
		}
	}

	protected async reset() {
		this._toggleNewTickListener(false);

		await this._map.reset();

		this.ticks = null;
		this.ticks = [];

		this.tickCount = 0;

		return this._doPreFetch();
	}

	// TODO: on destroy graceful
	protected async onDestroy() {
		await this._toggleNewTickListener(false);
	}
}