import IPC 				from '../ipc/IPC';
import {fork}    		from 'child_process';
import {WorkerOptions} 	from './WorkerChild';
import {log} 			from '../../../shared/logger';
import {Base} 			from '../../../shared/classes/Base';

export default class WorkerHost extends Base {

	public id: string | number;

	private _ipc: IPC;
	private _child: any = null;

	get ipc() {
		return this._ipc;
	}

	async init() {
		await super.init();

		this.id = this.options.id;
		this._ipc = this.options.ipc;

		return this._fork();
	}

	send(eventName, data?, waitForCallback?) {
		return this.ipc.send(this.id, eventName, data, waitForCallback);
	}

	async _fork() {
		return new Promise((resolve, reject) => {
			// Merge given options
			let now = Date.now(),
				resolved = false,
				childArgv = JSON.stringify({
					classArguments: this.options.classArguments || {},
					workerOptions: <WorkerOptions> {
						id: this.id,
						parentId: this.ipc.options.id,
						space: this.ipc.options.space
					}
				}),

				childOpt = {
					stdio: ['pipe', process.stdout, null, 'ipc']
				};

			this._child = fork(this.options.path, ['--no-deprecation', `--settings=${childArgv}`], childOpt);

			this._child.on('close', code => {
				log.info('WorkerHost', `${this.id} : exited with code ${code}`);

				this.emit('close', code);

				if (!resolved)
					reject('Child closed before ready');
			});

			this._child.stderr.on('data', (data) => {
				this.emit('error', data.toString());

				console.error(data.toString('ascii'));
			});

			this._child.once('message', message => {
				log.info('WorkerHost', `Creating ${this.id} took: ${Date.now() - now} ms`);

				resolved = true;
				if (message === '__ready') {
					resolve();
				} else {
					reject('First child message must always be the __ready, received: ' + message);
				}
			});

			this._child.on('exit', (code) => {
				this.emit('exit', code);
			});
		});
	}

	kill(code?: number) {
		this._child.kill(code);
	}
}
