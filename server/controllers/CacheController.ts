import * as path from 'path';
import WorkerHost from '../classes/worker/WorkerHost';
import App from '../app';
import {Base} from '../../shared/classes/Base';

export default class CacheController extends Base {

	public static readonly WORKER_ID = 'cache';

	private _worker: WorkerHost = null;

	constructor(options, protected app: App) {
		super(options);
	}

	public async init() {
		this._worker = new WorkerHost({
			id: CacheController.WORKER_ID,
			ipc: this.app.ipc,
			path: path.join(__dirname, '../classes/cache/Cache.js'),
			classArguments: {
				settings: this.app.controllers.config.config
			}
		});

		await this._worker.init();
	}

	public reset() {
		return this._worker.send('@reset');
	}

	public async updateBrokerSettings(settings) {
		return this._worker.send('broker:settings', settings, true);
	}

	public destroy() {
		if (this._worker)
			return this._worker.kill();
	}
}