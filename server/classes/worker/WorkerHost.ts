import IPC from "../ipc/IPC";
declare var clearInterval: any;

import {fork}    from 'child_process';
import * as _debug      from 'debug';
import Base             from '../Base';

const debug = _debug('TradeJS:WorkerHost');

export default class WorkerHost extends Base {

	public id: string | number;
	public _ipc: IPC;
	private _child: any = null;

	/**
	 *
	 * @param opt {Object}
	 */
	constructor(protected opt) {
		super(opt);
		this.id = this.opt.id;
		this._ipc = this.opt.ipc;
	}

	async init() {
		await super.init();
		return this._fork();
	}

	send(eventName, data?, waitForCallback?) {
		return this._ipc.send(this.id, eventName, data, waitForCallback);
	}

	async _fork() {

		debug(`Creating | id=${this.id}`);

		// Merge given options
		let childArgv = JSON.stringify({
				classArguments: this.opt.classArguments || {},
				workerOptions: {
					id: this.id,
					parentId: this._ipc.id
				}
			}),

			childOpt = {
				stdio: ['pipe', process.stdout, process.stderr, 'ipc']
			};

		// TODO - FUCKING ELECTRON!
		this._child = fork(this.opt.path, [`--settings=${childArgv}`], childOpt);

		this._child.on('close', code => {
			debug(`${this.id} exited with code ${code}`);
			this.emit('close', code);
		});

		await new Promise((resolve, reject) => {

			this._child.once('message', message => {
				if (message === '__ready') {
					debug(`Created | id=${this.id} | pid=${this._child.pid}`);
					resolve();
				} else {
					reject(message);
				}
			});
		});
	}

	kill(code?: number) {
		this._child.kill(code);
	}
}
