import * as winston	from 'winston-color';

declare var process: any;

require('source-map-support').install({
	handleUncaughtExceptions: true
});

import * as minimist    from 'minimist';
import Base             from '../Base';
import IPC              from '../ipc/IPC';

export interface WorkerOptions {
	id: string;
	parentId: string;
	space: string;
}

export default class WorkerChild extends Base {

	public id: string;

	protected _ipc: IPC;
	protected opt: any;

	constructor(options, private workerOptions: WorkerOptions) {
		super(options);

		/**
		 *
		 */
		this.id = workerOptions.id;

		/**
		 *
		 * @type {IPC}
		 * @private
		 */
		this._ipc = new IPC({id: this.workerOptions.id, space: this.workerOptions.space});
	}

	public async init() {
		await super.init();
		await this._ipc.init();
		await this._ipc.connectTo(this.workerOptions.parentId);
	}

	public debug(type: string, text: string, data?: Object): void {
		this._ipc.send('main', 'debug', {type, text, data}, false);
	}

	static initAsWorker() {

		if (typeof process !== 'undefined') {

			let mainFile = null,
				settings = JSON.parse((<any>minimist(process.argv.slice(2))).settings),
				id = settings.workerOptions.id,

				exitHandler = (code = 0) => {
					winston.info(`${id} exiting: ${code || 'ok'}`);
					process.exit(code);
				};

			process.once('uncaughtException', err => {
				console.log('uncaughtException!', err);
				exitHandler(1);
			});

			process.once('unhandledRejection', err => {
				console.error('unhandledRejection!', err);
				exitHandler(1)
			});

			process.once('SIGINT', exitHandler);
			process.once('SIGTERM', exitHandler);

			process.nextTick(async () => {
				mainFile = require(process.mainModule.filename).default;

				if (typeof mainFile !== 'function')
					return;

				const instance = new mainFile(settings.classArguments, settings.workerOptions);

				await instance.init();

				process.send('__ready');

				process.stdin.resume();
			});
		}
	}
}

// In case its running as worker
WorkerChild.initAsWorker();


