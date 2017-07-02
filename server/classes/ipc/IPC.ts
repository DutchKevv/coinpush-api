import * as NodeIPC from 'node-ipc';
import {log} 		from '../../../shared/logger';
import {Base} 		from '../../../shared/classes/Base';

declare let clearTimeout: any;
declare let window: any;

export default class IPC extends Base {

	private _server = null;
	private _unique = 0;
	private _ipc: any = null;
	private _acks: any = {};
	private _leftOver: any = null;

	public async init() {
		await super.init();

		this._setConfig();
	}

	send(workerId: string | number, eventName: string, data: any, waitForCallback = true): Promise<any> {

		return new Promise((resolve, reject) => {
			let type =  Buffer.isBuffer(data) || ArrayBuffer.isView(data) ? 'buffer' : 'json',
				cbTimeout = 60000,
				meta = <any>{
					type: type,
					eventName: eventName
				},
				__data: NodeBuffer,
				metaString;

			// Continue when waitForCallback is ack string OR true
			if (waitForCallback) {

				// Set a new callback listener
				if (waitForCallback === true) {
					let ack = meta.ack = <number>this.options.id + ++this._unique;

					let t = setTimeout(() => {
							delete this._acks[ack];
							reject(`Event [${eventName}] to [${workerId}] did not respond in time`);
						}, cbTimeout),
						cb = returnData => {
							delete this._acks[ack];
							clearTimeout(t);
							resolve(returnData);
						};

					this._acks[ack] = cb;
				}
				// This is a callback response, set the callback string as function;
				else {
					meta.ack = waitForCallback;
				}
			}

			// Stringify MetaData
			metaString = JSON.stringify(meta);

			// Stringify content (if JSON)
			if (type === 'json') {
				data = JSON.stringify(data || {}, (k, v) => {
					if (v && ArrayBuffer.isView(v)) {
						return Array.apply([], v);
					}
					return v;
				});
			}

			let contentLength = Buffer.byteLength(data, 'binary');
			let mapLength = 20;
			let metaLength =  metaString.length;
			let totalLength = mapLength + metaLength + contentLength;

			__data = Buffer.alloc(totalLength, 0, 'binary');
			__data.write(totalLength.toString(), 0, 10, 'binary');
			__data.write(metaLength.toString(), 10, 10, 'binary');

			// Meta JSON string
			__data.write(metaString, mapLength, metaLength, 'binary');

			// Content
			if (type === 'buffer') {
				__data.set(data, mapLength + metaLength);
			} else {
				__data.write(data, mapLength + metaLength, contentLength, 'binary');
			}

			if (!this._ipc.of[workerId] && this._server.server && this._server.server.of) {
				this._server.server.emit(this._server.server.of[workerId], __data);
			} else {
				this._ipc.of[workerId].emit(__data);
			}

			if (!waitForCallback)
				resolve();
		});
	}

	/**
	 *
	 * @private
	 */
	_setConfig() {
		this._ipc = new NodeIPC.IPC();
		this._ipc.config.id = this.options.id;
		// this._ipc.config.appspace = this.options.space;
		this._ipc.config.retry = 200;
		this._ipc.config.maxRetries = 10;
		this._ipc.config.silent = true;
		this._ipc.config.logInColor = true;
		this._ipc.config.rawBuffer = true;
		this._ipc.config.encoding = 'binary';
	}

	/**
	 *
	 * @returns {Promise}
	 * @private
	 */
	startServer(): Promise<any> {
		return new Promise((resolve) => {
			log.info('IPC', `${this.options.id} Starting server`);
			
			this._server = new NodeIPC.IPC();

			this._server.config.id = this.options.id;
			// this._ipc.config.appspace = this.options.space;
			this._server.config.retry = 200;
			this._server.config.maxRetries = 10;
			this._server.config.silent = true;
			this._server.config.logInColor = true;
			this._server.config.encoding = 'binary';
			this._server.config.rawBuffer = true;

			this._server.serve(() => {

				this._server.server.on('connect', (socket) => {

				});

				this._server.server.on('data', (data, socket) => this._onMessage(data, socket));

				this._server.server.on('error', (error, socket) => {
					console.error('IPC Server error: ' + error);
				});

				this._server.server.on('socket.disconnected', (socket, destroyedSocketID) => {
					this._server.log('client ' + destroyedSocketID + ' has disconnected!');
				});

				this._server.server.on('disconnected', (socket, destroyedSocketID) => {
					this._server.log(`${this._server.config.id} disconnected`);
				});
			});

			this._server.server.on('start', resolve);
			(<any>this._server.server).start();
		});
	}

	/**
	 *
	 * @param workerID {string}
	 * @returns {Promise}
	 * @private
	 */
	connectTo(workerId) {

		return new Promise((resolve, reject) => {

			this._ipc.connectTo(workerId, () => {
				let socket = this._ipc.of[workerId];

				socket.on('connect', async () => {
					await this.send(workerId, '__IPC_REGISTER__', {id: this.options.id});

					log.info('IPC', `${this.options.id} connected to ${workerId}`);

					resolve();
				});

				socket.on('disconnect', () => {
					log.info('IPC', `${this.options.id} disconnected from ${workerId}`);
				});

				socket.on('error', err => {
					console.error('IPC', `Error between ${this.options.id} and ${workerId}: `, err);
					// console.log(socket);
				});

				socket.on('data', (data) => this._onMessage(data, socket));
			});
		});
	}

	_register(id, socket) {
		socket.id = id;

		// node-ipc module hack
		socket.indexOf = () => {return -1};

		this._server.server.of[id] = socket;
	}


	_onMessage(buffer: Buffer, socket) {
		let i = 0,
			size, metaSize;

		if (socket.leftOver) {
			buffer = Buffer.concat([socket.leftOver, buffer]);
			socket.leftOver = null;
		}

		while (i < buffer.byteLength) {
			size = parseInt(buffer.toString('ascii', i, i + 10), 10);
			metaSize = parseInt(buffer.toString('ascii', i + 10, i + 20), 10);

			let _buffer = buffer.slice(i, i + size);

			i += size;

			// Not complete message
			if (i > buffer.byteLength) {
				socket.leftOver = Buffer.from(_buffer);
				return;
			}

			let metaStart = 20;
			let metaEnd = metaStart + metaSize;
			let meta = <any>{};

			try {
				meta = JSON.parse(_buffer.slice(metaStart, metaEnd).toString('ascii'));
			} catch (error) {
				console.log('META ERROR', size, metaSize, _buffer.slice(metaStart, metaEnd).toString('ascii'), error);
				throw error;
			}

			let content: any = _buffer.slice(metaEnd, size);

			if (meta.type === 'json') {
				try {
					content = JSON.parse(content.toString('ascii'))
				} catch (error) {
					console.log('CONTENT ERROR: ', size, metaSize, content.toString('ascii'), error);
					throw error;
				}
			} else {
				content = Buffer.from(content);
			}

			if (meta.eventName === '__IPC_REGISTER__') {
				if (!this._acks[meta.ack]) {
					this._register(content.id, socket);
					this.send(socket.id, meta.eventName, '', meta.ack).catch(console.error);
				} else {
					this._acks[meta.ack](null, socket);
					delete this._acks[meta.ack];
				}
				continue;
			}

			if (meta.ack && this._acks[meta.ack]) {
				this._acks[meta.ack](content, socket);
				delete this._acks[meta.ack];
				continue;
			}

			let cb;

			if (meta.ack) {
				cb = (err, returnData) => {

					if (err)
						return console.error(err);

					this.send(socket.id, meta.eventName, returnData, meta.ack).catch(console.error);
				}
			}

			this.emit(meta.eventName, content, cb, socket)
		}
	}
}