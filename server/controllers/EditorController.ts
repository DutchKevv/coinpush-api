import * as fs      from 'fs';
import * as path    from 'path';
import * as winston	from 'winston-color';
import {fork}      	from 'child_process';
import {compile}	from '../compile/Compiler';
import WorkerHost from '../classes/worker/WorkerHost';
import {Base} from '../../shared/classes/Base';

const rmdir = require('rmdir');

export default class EditorController extends Base {

	private _worker = null;
	private _directoryTree = [];
	private _runnableList = {
		ea: [],
		indicator: [],
		template: []
	};

	get directoryTree() {
		return this._directoryTree;
	}

	get runnableList() {
		return this._runnableList;
	}

	constructor(protected __options, protected app) {
		super(__options);
	}

	public async init() {
		await super.init();

		return this._initWorker();
	}

	public loadFile(id) {
		return this._worker.send('file:load', {id});
	}

	public async save(id, content) {
		return this._worker.send('file:save', {id, content});
	}

	public rename(id, name) {
		return this._worker.send('file:rename', {id, name});
	}

	public delete(id) {
		return this._worker.send('file:delete', {id});
	}

	public createFile(parent: string, name: string, content = '') {
		return this._worker.send('file:create', {parent, name, content});
	}

	public createDirectory(parent: string, name: string) {
		return this._worker.send('directory:create', {parent, name});
	}

	private async _initWorker() {
		winston.info('Loading editor worker');

		this._worker = new WorkerHost({
			id: 'editor',
			ipc: this.app.ipc,
			path: path.join(__dirname, '../classes/editor/Editor.js'),
			classArguments: {
				rootPath: this.app.controllers.config.config.path.custom
			},

		});

		await this._worker.init();

		this._worker.ipc.on('exit', (code) => {
			console.log('exit ' + code);
		});

		this._worker.ipc.on('error', (error) => {
			console.log(error);
		});

		this._worker.ipc.on('compile-result', (result) => {

			if (result.errors.length) {
				result.errors.forEach(error => {
					this.app.debug('error', error.message);
				})

			} else {
				this.app.debug('info', 'Compile complete');
			}
			console.log('compile-result', result);
		});

		this._worker.ipc.on('directory-list', (list) => {
			this._directoryTree = list;
			// this.emit('directory-list', list);
		});

		this._worker.ipc.on('runnable-list', (list) => {
			this._runnableList = list;
			// this.emit('runnable-list', list);
		});
	}
}
