import Base from '../Base';
import * as winston from 'winston-color';

declare var clearTimeout: any;
declare var window: any;

export default class IPC extends Base {

	id: string | number;
	env: string;

	private _buffer = [];
	private _server = null;
	private _client = null;
	private _unique = 0;
	private _ipc: any = null;
	private _acks: any = {};

	constructor(protected opt) {
		super(opt);

		this.id = this.opt.id;
		this.env = this._getEnvironment();
	}

	/**
	 *
	 * @returns {Promise.<TResult>|*}
	 */
	init() {
		return super
			.init()
			.then(() => {
				if (this.env === 'node')
					return this._setConfigNode();
			});
	}

	/**
	 *
	 * @returns {Promise}
	 */
	startServer() {
		winston.info(`${this.id} is starting IPC server`);

		if (this.env === 'node') {
			return this._startServerNode();
		}
	}

	/**
	 *
	 * @param workerId {string}
	 * @returns {Promise}
	 */
	connectTo(workerId) {
		winston.info(`${this.id} connecting to ${workerId}`);
		// debug(`${this.id} connecting to ${workerId}`);

		if (this.env === 'node') {
			return this._connectToNode(workerId);
		} else {

		}
	}

	send(workerId: string | number, eventName: string, data: any, waitForCallback = true): Promise<any> {

		return new Promise((resolve, reject) => {
			let type =  Buffer.isBuffer(data) || ArrayBuffer.isView(data) ? 'buffer' : 'json',
				cbTimeout = 60000,
				meta = <any>{
					type: type,
					eventName: eventName,
					id: this.id
				},
				__data: NodeBuffer,
				metaString;

			// Continue when waitForCallback is ack string OR true
			if (waitForCallback) {

				// Set a new callback listener
				if (waitForCallback === true) {
					let ack = meta.ack = <number>this.id + ++this._unique;

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


			if (type === 'json') {
				data = JSON.stringify(data || {}, (k, v) => {
					if (v && v.buffer && v.buffer instanceof  ArrayBuffer) {
						return Array.apply([], v);
					}
					return v;
				});
			}

			let contentLength = Buffer.byteLength(data, 'ascii');
			meta.contentLength = contentLength;

			metaString = JSON.stringify(meta);

			let mapLength = 20; // Uint32Array.BYTES_PER_ELEMENT * 2;
			let metaLength =  Buffer.byteLength(metaString, 'ascii');
			let totalLength = mapLength + metaLength + contentLength;

			__data = Buffer.alloc(totalLength, 0);
			__data.write(totalLength.toString(), 0, 10, 'ascii');
			__data.write(metaLength.toString(), 10, 10, 'ascii');
			// __data.writeUInt32BE(totalLength, 0); // Total buffer length
			// __data.writeUInt32BE(metaLength, 4); // Metadata length

			__data.write(metaString, mapLength, metaLength, 'ascii'); // Meta JSON string


			if (type === 'buffer') {
				data.copy(__data, mapLength + metaLength);
			} else {
				__data.write(data, mapLength + metaLength, contentLength, 'ascii'); // Content
			}

			if (!this._ipc.of[workerId] && this._server && this._server.of) {
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
	_setConfigNode() {

		this._ipc = require('node-ipc');

		this._ipc.config.id = this.id;
		this._ipc.config.retry = 200;
		this._ipc.config.maxRetries = 10;
		this._ipc.config.silent = true;
		this._ipc.config.logInColor = true;
		this._ipc.config.requiresHandshake = true;
		this._ipc.config.rawBuffer = true;
		this._ipc.config.rawSocket = true;
		this._ipc.config.encoding = 'binary';
		this._ipc.config.delimiter = '\f';
		// this._ipc.config.sync = true;
	}

	/**
	 *
	 * @returns {Promise}
	 * @private
	 */
	_startServerNode() {
		return new Promise((resolve) => {

			let ipc = require('node-ipc');

			this._server = new ipc.IPC();

			this._server.config.id = this.id;
			this._server.config.retry = 200;
			this._server.config.maxRetries = 10;
			this._server.config.silent = true;
			this._server.config.logInColor = true;
			// this._server.config.requiresHandshake = true;
			this._server.config.encoding = 'binary';
			this._server.config.rawBuffer = true;
			this._server.config.rawSocket = true;
			this._server.config.delimiter = '\f';
			this._server.serve(() => {

				this._server.server.on('connect', (socket) => {

				});

				this._server.server.on('data', (data, socket) => {
					this._onMessage(data, socket);
				});

				// this._server.server.on('message', (data, socket) => {
				// 	this._onMessage(data, socket);
				// });

				this._server.server.on('socket.disconnected', (socket, destroyedSocketID) => {
					this._server.log('client ' + destroyedSocketID + ' has disconnected!');
				});

				this._server.server.on('disconnected', (socket, destroyedSocketID) => {
					this._server.log(`${this._server.config.id} disconnected`);
				});

				this.on('__IPC_REGISTER__', (data, cb, socket) => {
					this._server.server.of[data.id] = socket;
					cb(null, {});
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
	_connectToNode(workerId) {

		return new Promise((resolve, reject) => {

			this._ipc.connectTo(workerId, () => {
				let socket = this._ipc.of[workerId];

				socket.on('connect', async () => {
					await this.send(workerId, '__IPC_REGISTER__', {id: this.id});

					winston.info(`${this.id} connected to ${workerId}`);

					resolve();
				});

				socket.on('disconnect', () => {
					winston.info(`${this.id} disconnected from ${workerId}`);
				});

				socket.on('error', err => {
					winston.info(`${this.id} error`, err);

					reject(err);
				});

				socket.on('data', (data) => {
					this._onMessage(data, socket)
				});
			});
		});
	}

	_registerNode(id, socket) {
		this._server.server.of[id] = socket;
	}

	_onMessage(buffer: NodeBuffer, socket) {
		// console.log('ALL', buffer.length, buffer.toString('binary'));

		let i = 0;

		while (i < buffer.byteLength) {
			let size = parseInt(buffer.toString('ascii', i, i + 10), 10);
			let metaSize = parseInt(buffer.toString('ascii', i + 10, i + 20), 10);

			let _buffer = buffer.slice(i, i + size);

			i += size;

			let metaStart = 20;
			let metaEnd = metaStart + metaSize;
			let metaData = <any>{};

			try {
				metaData = JSON.parse(_buffer.slice(metaStart, metaEnd).toString('binary'));
			} catch (error) {
				console.log('META ERROR');
				throw error;
			}

			let content: any = _buffer.slice(metaEnd, metaEnd + metaData.contentLength);

			if (metaData.eventName === '__IPC_REGISTER__') {
				if (!this._acks[metaData.ack]) {
					this._registerNode(metaData.id, socket);
					this.send(metaData.id, metaData.eventName, '', metaData.ack).catch(console.error);
				} else {
					this._acks[metaData.ack](null, socket);
					delete this._acks[metaData.ack];
				}
				continue;
			}

			if (metaData.type === 'json') {
				try {
					content = JSON.parse(_buffer.slice(metaEnd, metaEnd + metaData.contentLength).toString())

				} catch (error) {
					console.log('CONTENT ERROR: ', error);
					throw error;
				}
			}

			if (metaData.ack && this._acks[metaData.ack]) {
				this._acks[metaData.ack](content, socket);
				delete this._acks[metaData.ack];
				continue;
			}

			let cb;

			if (metaData.ack) {
				cb = (err, returnData) => {

					if (err)
						return console.error(err);

					this.send(metaData.id, metaData.eventName, returnData, metaData.ack).catch(console.error);
				}
			}

			this.emit(metaData.eventName, content, cb, socket)
		}
	}

	/**
	 *
	 * @returns {string}
	 * @private
	 */
	_getEnvironment() {
		return typeof window === 'undefined' ? 'node' : 'browser';
	}
}