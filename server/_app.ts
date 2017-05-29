import AccountController from './controllers/AccountController';
require('source-map-support').install({handleUncaughtExceptions: true});
import './util/more-info-console';

import Socket = SocketIO.Socket;

import * as winston         from 'winston-color';
import * as io              from 'socket.io';
import * as http            from 'http';
import {json, urlencoded}   from 'body-parser';
import * as path            from 'path';
import * as freePort        from 'freeport';
import * as merge       	from 'deepmerge';

import Base                 from './classes/Base';
import IPC                  from './classes/ipc/IPC';

import CacheController      from './controllers/CacheController';
import SystemController     from './controllers/SystemController';
import InstrumentController from './controllers/InstrumentController';
import EditorController     from './controllers/EditorController';
import ConfigController     from './controllers/ConfigController';
import BrokerController     from './controllers/BrokerController';

const express: any = require('express');

const
	DEFAULT_TIMEZONE = 'America/New_York',
	PATH_PUBLIC_DEV = path.join(__dirname, '../client/dist'),
	PATH_PUBLIC_PROD = path.join(__dirname, '../client/dist');

export interface IApp {
	system: {
		port: number;
		timezone: string;
	}
	path: {
		cache: string;
		custom: string;
		config: string;
	}
}

/**
 * @class App
 */
export default class App extends Base {

	public readonly isWin = /^win/.test(process.platform);
	public readonly isElectron = process && process.versions['electron'];

	public controllers: {
		config: ConfigController,
		account: AccountController,
		system: SystemController,
		broker: BrokerController,
		cache: CacheController,
		editor: EditorController,
		instrument: InstrumentController
	} = <any>{};

	public get ipc() {
		return this._ipc;
	}

	public get io() {
		return this._io;
	}

	private _ipc: IPC = new IPC({id: 'main'});
	private _http: any = null;
	private _io: any = null;
	private _httpApi: any = null;

	private _debugInterval = null;
	private _debugBuffer = [];
	private _debugLastMessage = null;
	private _debugMessageRepeat = 0;

	private _defaults = <IApp>{
		account: {
			'broker': 'oanda',
			'id': null,
			'environment': '',
			'username': null,
			// 'token': null,
			// 'accountId': null
		},
		system: {
			port: 3000,
			timezone: 'America/New_York',
		},
		path: {
			custom: path.join(__dirname, '..', 'custom'),
			cache: path.join(__dirname, '..', '_cache'),
			config: path.join(__dirname, '..', '_config')
		}
	};

	public async init(): Promise<any> {

		// Make sure the app can be cleaned up on termination
		this._setProcessListeners();

		// Merge options
		this.options = merge(this._defaults, this.options);

		// Initialize ConfigController first so other controllers can use config
		this.controllers.config = new ConfigController(this.options, this);

		let config = await this.controllers.config.init();

		// Set timezone
		await this._setTimezone(config.system.timezone);

		// Create IPC hub
		await this._initIPC();

		// Create app controllers
		this.controllers.system = new SystemController({}, this);
		this.controllers.broker = new BrokerController({}, this);
		this.controllers.account = new AccountController({}, this);
		this.controllers.cache = new CacheController({path: config.path.cache}, this);
		this.controllers.editor = new EditorController({path: config.path.custom}, this);
		this.controllers.instrument = new InstrumentController({}, this);

		// Start public API so client can follow booting process
		await this._initAPI();

		// Initialize controllers
		await this.controllers.system.init();
		await this.controllers.broker.init();
		await this.controllers.cache.init();
		await this.controllers.instrument.init();
		await this.controllers.editor.init();

		await this.controllers.broker.loadBrokerApi('oanda');

		this.controllers.system.update({booting: false});

		this._setDebugBufferFlushInterval();

		this.emit('app:ready');
	}

	public debug(type: string, text: string, data?: Object, socket?: Socket): void {
		// if (type === 'error')
		// 	console.warn('ERROR', text);

		this._debugBuffer.push({type, text, data});


	}

	private _setDebugBufferFlushInterval() {
		// Set debug interval
		this._debugInterval = setInterval(() => {

			if (!this._debugBuffer.length || !this._io || !this._io.sockets) {
				return;
			}

			this._io.sockets.emit('debug', this._debugBuffer);
			this._debugBuffer = [];
		}, 200);
	}

	private async _initIPC(): Promise<void> {
		await this._ipc.init();
		await this._ipc.startServer();

		this._ipc.on('debug', (data, cb, socketId) => {
			this.debug(data.type, `<a href="#${socketId}">${socketId}:</a> ${data.text}`, data.data);
		});
	}

	/**
	 *
	 * @private
	 */
	private _initAPI(): Promise<any> {

		return new Promise((resolve, reject) => {
			winston.info('Starting API');

			let port = this.controllers.config.get().system.port;

			this._httpApi = express();
			this._http = http.createServer(this._httpApi);
			this._io = io.listen(this._http);

			this._httpApi.use(function(req, res, next) {
				res.header('Access-Control-Allow-Origin', '*');
				res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
				next();
			});

			// this._httpApi.use(cors({origin: 'http://localhost:4200'}));
			this._httpApi.use(express.static(process.env.NODE_ENV === 'production' ? PATH_PUBLIC_PROD : PATH_PUBLIC_DEV));

			this._httpApi.use(json());
			this._httpApi.use(urlencoded({extended: true}));

			// Index root
			this._httpApi.get('/', (req, res) => {
				res.sendFile(path.join(__dirname, '../client/dist/index.html'));
			});

			// Authentication routes
			this._httpApi.use('/', require('./api/http/auth')(this));

			// Application routes (WebSockets)
			this._io.on('connection', socket => {
				winston.info('a websocket connected');

				require('./api/socket/system')(this, socket);
				require('./api/socket/editor')(this, socket);
				require('./api/socket/backtest')(this, socket);
				require('./api/socket/instrument')(this, socket);

				socket.emit('system:state', this.controllers.system.state);

				this.debug('info', 'Connected to server');
			});

			this._http.listen(port, () => {
				// Angular DEV-Server : localhost:4200 \n\n
				console.log(`\n
	${process.env.NODE_ENV === 'production' ? '' : 'Angular DEV-Server : localhost:4200 \n\n'}
	R.E.S.T. API       : localhost:${port} \n
				`);

				this.debug('info', 'Public API started');

				resolve();
			});

			/**
			 * Server events
			 */
			let tickBuffer = [];
			let tickInterval = setInterval(() => {
				if (!tickBuffer.length) return;

				this._io.sockets.emit('ticks', tickBuffer);
				tickBuffer = [];
			}, 100);

			this.controllers.cache.on('tick', (tick) => {
				tickBuffer.push(tick);
			});

			this.controllers.editor.on('runnable-list:change', (runnableList) => {
				this._io.sockets.emit('editor:runnable-list', runnableList);
			});

			this.controllers.system.on('change', state => {
				this._io.sockets.emit('system:state', state);
			});

			this.controllers.editor.on('change', () => {
				this._io.sockets.emit('editor:change', {});
			});

			this.controllers.instrument.on('created', instrument => {
				this._io.sockets.emit('instrument:created', {
					id: instrument.id,
					timeFrame: instrument.timeFrame,
					instrument: instrument.instrument,
					live: instrument.live
				});
			});
		});
	}

	private _getFreePort() {
		return new Promise((resolve, reject) => {
			freePort(function (err, port) {
				if (err) reject(err);
				resolve(port);
			});
		});

	}

	private _setTimezone(timeZone) {
		return new Promise((resolve, reject) => {
			process.env.TZ = timeZone || DEFAULT_TIMEZONE;
			resolve();
		});
	}

	private _setProcessListeners() {

		const processExitHandler = error => {
			this.destroy()
				.then(() => process.exit(0))
				.catch(err => {
					process.exit(1);
				});
		};

		process.on('SIGTERM', processExitHandler);
		process.on('SIGINT', processExitHandler);
		process.on('unhandledRejection', error => {
			// console.warn('unhandledRejection');
			console.error('unhandledRejection', error);
			processExitHandler(error);
		});
	}

	private async _killAllChildProcesses() {
		await this.controllers.instrument.destroyAll();
		await this.controllers.cache.destroy();
	}

	async destroy(): Promise<any> {
		winston.info('Shutting down and cleaning up child processes');
		this.debug('warning', 'Shutting down server');

		await this._killAllChildProcesses();

		// this._httpApi.close();
		this._httpApi = null;
		this._http = null;
		this._io = null;

		return;
	}
}
