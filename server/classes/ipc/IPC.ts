import * as NodeIPC from 'node-ipc';
import {log}        from '../../../shared/logger';
import {Base}        from '../../../shared/classes/Base';

declare let clearTimeout: any;
declare let window: any;

interface IMessageMeta {
	type: string;
	event: string;
	error?: any;
	ack?: any;
};

export default class IPC extends Base {

	public static readonly DEFAULT_TIMEOUT = 60000; // 1 minute

	private _server = null;
	private _unique = 0;
	private _ipc: any = null;
	private _acks: any = {};
	private _leftOver: any = null;

	public async init() {
		await super.init();

		this._setConfig();
	}

	public startServer(): Promise<any> {
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

	public connectTo(workerId) {

		return new Promise((resolve, reject) => {

			this._ipc.connectTo(workerId, () => {
				let socket = this._ipc.of[workerId];

				socket.on('connect', async () => {
					await this.sendAsync(workerId, '__IPC_REGISTER__', {id: this.options.id});

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

	public sendAsync(workerId: string | number, eventName: string, data: any): Promise<any> {
		return new Promise((resolve, reject) => {
			let ack = <number>this.options.id + ++this._unique,
				timeout, cb;

			// Set timeout for message that do not respond on time.
			timeout = setTimeout(() => {
				delete this._acks[ack];
				reject(`Event [${eventName}] to [${workerId}] did not respond in time`);
			}, IPC.DEFAULT_TIMEOUT);

			// Callback executed when receiver responds
			cb = (err, returnData) => {
				clearTimeout(timeout);
				delete this._acks[ack];

				if (err)
					return reject(err);

				resolve(returnData);
			};

			this._acks[ack] = cb;
			this._send(workerId, eventName, data, ack);
		});
	}

	public send(workerId: string | number, event: string, data?: any): void {
		this._send(workerId, event, data);
	}

	private _send(workerId: string | number, event: string, data?, ack?: any, error?: any): void {
		let type = Buffer.isBuffer(data) || ArrayBuffer.isView(data) ? 'buffer' : 'json',
			meta: IMessageMeta = {
				type: type,
				event: event
			},
			contentLength = 0, mapLength = 20,
			metaString, metaLength, totalLength, __data: NodeBuffer;

		if (ack)
			meta.ack = ack;
		
		if (error)
			meta.error = error;

		// Stringify MetaData
		metaString = JSON.stringify(meta);
		metaLength = metaString.length;

		// Stringify content (if JSON and no error)
		if (!error && typeof data !== undefined) {
			if (type === 'json') {
				data = JSON.stringify(data || {}, (k, v) => {
					if (v && ArrayBuffer.isView(v)) {
						return Array.apply([], v);
					}
					return v;
				});
			}

			contentLength = Buffer.byteLength(data, 'binary');
		}

		totalLength = mapLength + metaLength + contentLength;

		__data = Buffer.alloc(totalLength, 0, 'binary');
		__data.write(totalLength.toString(), 0, 10, 'binary');
		__data.write(metaLength.toString(), 10, 10, 'binary');

		// Meta JSON string
		__data.write(metaString, mapLength, metaLength, 'binary');

		// Content
		if (!error && typeof data !== undefined) {
			if (type === 'buffer') {
				__data.set(data, mapLength + metaLength);
			} else {
				__data.write(data, mapLength + metaLength, contentLength, 'binary');
			}
		}

		if (!this._ipc.of[workerId] && this._server.server && this._server.server.of) {
			this._server.server.emit(this._server.server.of[workerId], __data);
		} else {
			this._ipc.of[workerId].emit(__data);
		}
	}

	private _onMessage(buffer: Buffer, socket) {
		let i = 0,
			meta: IMessageMeta,
			metaStart = 20,
			metaEnd: number, size: number, metaSize: number,
			_buffer: NodeBuffer;

		if (socket.leftOver) {
			buffer = Buffer.concat([socket.leftOver, buffer]);
			socket.leftOver = null;
		}

		while (i < buffer.byteLength) {
			size = parseInt(buffer.toString('ascii', i, i + 10), 10);
			metaSize = parseInt(buffer.toString('ascii', i + 10, i + 20), 10);

			_buffer = buffer.slice(i, i + size);

			i += size;

			// Not complete message
			if (i > buffer.byteLength) {
				socket.leftOver = Buffer.from(_buffer);
				return;
			}

			metaEnd = metaStart + metaSize;

			try {
				meta = JSON.parse(_buffer.slice(metaStart, metaEnd).toString('ascii'));
			} catch (error) {
				console.error('META ERROR', size, metaSize, _buffer.slice(metaStart, metaEnd).toString('ascii'), error);
				throw error;
			}

			let content: any = _buffer.slice(metaEnd, size);

			if (meta.type === 'json') {
				try {
					content = JSON.parse(content.toString('ascii'))
				} catch (error) {
					console.error('CONTENT ERROR: ', size, metaSize, content.toString('ascii'), error);
					throw error;
				}
			} else {
				content = Buffer.from(content);
			}

			if (meta.event === '__IPC_REGISTER__') {
				if (!this._acks[meta.ack]) {
					this._register(content.id, socket);
					this._send(socket.id, meta.event, undefined, meta.ack);
				} else {
					this._acks[meta.ack](null, socket);
					delete this._acks[meta.ack];
				}
				continue;
			}

			// Message is a callback result
			if (meta.ack && this._acks[meta.ack]) {
				this._acks[meta.ack](meta.error, content);
				delete this._acks[meta.ack];
				continue;
			}

			let cb;

			// Message expects answer
			if (meta.ack)
				cb = (err, data) => this._send(socket.id, meta.event, data, meta.ack, err);

			this.emit(meta.event, content, cb, socket)
		}
	}

	private _setConfig() {
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

	private _register(id, socket) {
		socket.id = id;

		// node-ipc module hack
		socket.indexOf = () => {
			return -1
		};

		this._server.server.of[id] = socket;
	}

	public destroyAllConnection() {

		if (this._ipc)
			try {
				Object.keys(this._ipc.of).forEach(id => this._ipc.disconnect(id));
			} catch (error) {
				console.log(error);
			}


		if (this._server)
			try {
				Object.keys(this._server.of).forEach(id => this._ipc.disconnect(id));
			} catch (error) {
				console.log(error);
			}
	}
}