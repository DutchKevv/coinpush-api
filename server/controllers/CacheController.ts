import * as path from 'path';
import WorkerHost from '../classes/worker/WorkerHost';
import App from '../app';
import {Base} from '../../shared/classes/Base';

export default class CacheController extends Base {

	private _worker: WorkerHost = null;
	private _symbolList: Array<any> = [];

	constructor(protected __options, protected app: App) {
		super(__options);
	}

	public async init() {

		this._worker = new WorkerHost({
			id: 'cache',
			ipc: this.app.ipc,
			path: path.join(__dirname, '../classes/cache/Cache.js'),
			classArguments: {
				settings: this.app.controllers.config.config
			}
		});

		await this._worker.init();

		this._worker.ipc.on('ticks', ticks => this.emit('ticks', ticks));
	}

	public read(symbol, timeFrame, from, until, bufferOnly) {

		return this
			._worker
			.send('read', {
				symbol: symbol,
				timeFrame: timeFrame,
				from: from,
				until: until,
				bufferOnly: bufferOnly
			});
	}

	public fetch(symbol: string, timeFrame: string, from: number, until: number) {
		return this
			._worker
			.send('fetch', {
				symbol: symbol,
				timeFrame: timeFrame,
				from: from,
				until: until
			});
	}

	public reset() {
		return this
			._worker
			.send('@reset');
	}

	public getSymbolList() {
		return this._worker.send('symbol:list');
	}

	public async updateSettings(settings) {
		return this._worker.send('broker:settings', settings, true);
	}

	public destroy() {
		if (this._worker)
			return this._worker.kill();
	}
}