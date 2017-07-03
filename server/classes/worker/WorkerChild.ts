require('source-map-support').install({
	handleUncaughtExceptions: true
});

import * as minimist    from 'minimist';
import IPC              from '../ipc/IPC';
import {Base} 			from '../../../shared/classes/Base';
import {log} 			from '../../../shared/logger';

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
		this.ipc.send('main', 'debug', {type, text, data});
	}



	public onDestroy() {
		super.onDestroy();
	}
}

let initAsWorker = function() {

	if (typeof process !== 'undefined') {

		let mainFile = null,
			settings = JSON.parse((<any>minimist(process.argv.slice(2))).settings),
			id = settings.workerOptions.id,
			instance,

			exitHandler = (code = 0) => {
				log.info('WorkerChild', `${id} exiting ${code}`);
				if (instance)
					try {
						instance.ipc.destroyAllConnection();
					} catch (error) {
						console.error(error);
					}
				process.exit(code);
			};

		process.once('uncaughtException', err => {
			console.log(err);
			log.error('WorkerChild', 'uncaughtException', err);
			exitHandler(1);
		});

		process.once('unhandledRejection', err => {
			log.error('WorkerChild', 'unhandledRejection', err);
			exitHandler(1)
		});

		process.once('SIGINT', exitHandler);
		process.once('SIGTERM', exitHandler);

		process.nextTick(async () => {
			mainFile = require(process.mainModule.filename).default;

			if (typeof mainFile !== 'function')
				return;

			instance = new mainFile(settings.classArguments, settings.workerOptions);

			await instance.init();

			process.send('__ready');

			process.stdin.resume();
		});
	}
};

// In case its running as worker
initAsWorker();


