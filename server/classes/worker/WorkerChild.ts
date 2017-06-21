require('source-map-support').install({
	handleUncaughtExceptions: true
});

import * as minimist    from 'minimist';
import IPC              from '../ipc/IPC';
import {Base} 			from '../../../shared/classes/Base';
import {winston}		from '../../logger';

export interface WorkerOptions {
	id: string;
	parentId: string;
	space: string;
}

export default class WorkerChild extends Base {

	get id() {
		return this._workerOptions.id;
	}

	get ipc() {
		return this._ipc;
	}

	private _ipc: IPC;

	constructor(protected __options, private _workerOptions: WorkerOptions) {
		super(__options);
	}

	public async init() {
		await super.init();

		this._ipc = new IPC({id: this._workerOptions.id, space: this._workerOptions.space});
		await this.ipc.init();
		await this.ipc.connectTo(this._workerOptions.parentId);
	}

	public debug(type: string, text: string, data?: Object): void {
		this.ipc.send('main', 'debug', {type, text, data}, false);
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

	public onDestroy() {
		super.onDestroy();
	}
}

// In case its running as worker
WorkerChild.initAsWorker();


