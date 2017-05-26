import Base from '../Base';
import * as winston from 'winston-color';

declare var clearTimeout: any;
declare var window: any;

export default class IPC extends Base {

	id: string | number;
	env: string;

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
		} else {

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

	send(workerId: string | number, eventName: string, data: any = {}, waitForCallback = true): Promise<any> {

		return new Promise((resolve, reject) => {
			let cbTimeout = 60000,
				_data = <any>{
					type: eventName,
					id: this.id,
					data: data
				};

			// Continue when waitForCallback is ack string OR true
			if (waitForCallback) {

				// Set a new callback listener
				if (waitForCallback === true) {
					let ack = _data.ack = <number>this.id + ++this._unique;

					let t = setTimeout(() => {
							delete this._acks[ack];
							reject(`Event [${eventName}] to [${workerId}] did not respond in time`);
						}, cbTimeout),
						cb = returnData => {
							clearTimeout(t);
							resolve(returnData);
						};

					this._acks[ack] = cb;
				}
				// This is a callback response, set the callback string as function;
				else {
					_data.ack = waitForCallback;
				}
			}

			if (!this._ipc.of[workerId] && this._ipc.server && this._ipc.server.of) {
				this._ipc.server.emit(this._ipc.server.of[workerId], 'message', _data);
			} else {
				this._ipc.of[workerId].emit('message', _data);
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
	}

	/**
	 *
	 * @returns {Promise}
	 * @private
	 */
	_startServerNode() {
		return new Promise((resolve) => {

			this._ipc.serve(() => {

				this._ipc.server.on('connect', (socket) => {
				});

				this._ipc.server.on('message', (data, socket) => {
					this._onMessage(data, socket);
				});

				this._ipc.server.on('socket.disconnected', (socket, destroyedSocketID) => {
					this._ipc.log('client ' + destroyedSocketID + ' has disconnected!');
				});

				this._ipc.server.on('disconnected', (socket, destroyedSocketID) => {
					this._ipc.log(`${this._ipc.config.id} disconnected`);
				});
			});

			this._ipc.server.on('start', resolve);
			(<any>this._ipc.server).start();
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

				socket.on('connect', () => {
					winston.info(`${this.id} connected to ${workerId}`);
					// debug(`${this.id} connected to ${workerId}`);
					resolve();
				});

				socket.on('disconnect', () => {
					winston.info(`${this.id} disconnected from ${workerId}`);
					// debug(`${this.id} disconnected from ${workerId}`);
				});

				socket.on('error', err => {
					winston.info(`${this.id} error`, err);

					// debug(`${this.id} error`, err);
					reject(err);
				});

				socket.on('message', (data) => {
					this._onMessage(data, socket)
				});
			});
		});
	}

	/**
	 * If there is a cb stored for the function, it means the next one should not get a callback function
	 *
	 * @param data
	 * @private
	 */
	_onMessage(data, socket) {
		if (this._acks[data.ack]) {
			this._acks[data.ack](data.data);
			delete this._acks[data.ack];
			return;
		}

		let cb;

		if (data.ack) {
			cb = (err, returnData) => {

				if (err)
					return console.error(err);

				this.send(data.id, data.type, returnData, data.ack).catch(console.error);
			}
		}

		this.emit(data.type, data.data, cb, socket.id)
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

