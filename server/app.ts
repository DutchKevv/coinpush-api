import AccountController from './controllers/AccountController';
require('source-map-support').install({handleUncaughtExceptions: true});
import './util/more-info-console';

// import Socket = SocketIO.Socket;

import * as io              from '../shared/node_modules/socket.io';
import * as http            from 'http';
import {json, urlencoded}   from 'body-parser';
import * as path            from 'path';
import * as freePort        from 'freeport';
import * as merge       	from 'deepmerge';

import IPC                  from './classes/ipc/IPC';
import CacheController      from './controllers/CacheController';
import SystemController     from './controllers/SystemController';
import InstrumentController from './controllers/InstrumentController';
import EditorController     from './controllers/EditorController';
import ConfigController     from './controllers/ConfigController';
import BrokerController     from './controllers/BrokerController';
import BacktestController 	from './controllers/BacktestController';
import {winston} 			from './logger';
import {Base} 				from '../shared/classes/Base';
import {InstrumentSettings} from '../shared/interfaces/InstrumentSettings';

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

	public static readonly DEFAULTS = <IApp>{
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

	public readonly space = undefined; // 'app-' + Date.now();
	public readonly isWin = /^win/.test(process.platform);
	public readonly isElectron = process && (process.env.ELECTRON || process.versions['electron']);

	public controllers: {
		account: AccountController,
		backtest: BacktestController,
		broker: BrokerController,
		cache: CacheController,
		config: ConfigController,
		editor: EditorController,
		instrument: InstrumentController,
		system: SystemController
	} = <any>{};

	public get ipc() {
		return this._ipc;
	}

	public get io() {
		return this._io;
	}

	private _ipc: IPC = null;
	private _http: any = null;
	private _io: any = null;
	private _httpApi: any = null;

	private _debugInterval = null;
	private _debugBuffer = [];
	private _debugLastMessage = null;
	private _debugMessageRepeat = 0;

	public async init(): Promise<any> {

		// Make sure the app can be cleaned up on termination
		this._setProcessListeners();

		// Initialize ConfigController first so other controllers can use config
		this.controllers.config = new ConfigController(this.options, this);

		let config = await this.controllers.config.init();

		// Set timezone
		await this._setTimezone(config.system.timezone);

		// Create IPC hub
		this._ipc = new IPC({id: 'main', space: this.space});
		await this._ipc.init();
		await this._ipc.startServer();
		this._setIpcListeners();

		// Create app controllers
		this.controllers.system = new SystemController({}, this);
		this.controllers.broker = new BrokerController({}, this);
		this.controllers.account = new AccountController({}, this);
		this.controllers.cache = new CacheController({path: config.path.cache}, this);
		this.controllers.editor = new EditorController({path: config.path.custom}, this);
		this.controllers.instrument = new InstrumentController({}, this);
		this.controllers.backtest = new BacktestController({}, this);

		// Start public API so client can follow booting process
		await this._initAPI();

		// Initialize controllers
		await this.controllers.system.init();
		await this.controllers.broker.init();
		await this.controllers.cache.init();
		await this.controllers.instrument.init();
		await this.controllers.editor.init();
		await this.controllers.backtest.init();

		await this.controllers.broker.loadBrokerApi('oanda');

		this.controllers.system.update({booting: false});

		this._setDebugBufferFlushInterval();

		this.emit('app:ready');
	}

	public debug(type: string, text: string, data?: Object, socket?): void {
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

	private _setIpcListeners(): void {
		this.ipc.on('debug', (data, cb, socketId) => {
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
				require('./api/socket/cache')(this, socket);
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

			this.controllers.instrument.on('created', (instrument: InstrumentSettings) => {
				this._io.sockets.emit('instrument:created', {
					id: instrument.id,
					symbol: instrument.symbol,
					timeFrame: instrument.timeFrame,
					live: instrument.live
				});
			});

			// this.ipc.on('cache:fetch:status', (data) => {
			// 	this._io.sockets.emit('cache:fetch:status', data);
			// });

			this.controllers.editor.on('directory-list', (directoryList) => {
				this._io.sockets.emit('editor:directory-list', directoryList);
			});

			this.controllers.editor.on('runnable-list', (runnableList) => {
				console.log('runafsdf', runnableList)
				this._io.sockets.emit('editor:runnable-list', runnableList);
			});

			this.controllers.system.on('change', state => {
				this._io.sockets.emit('system:state', state);
			});

			this.controllers.editor.on('change', () => {
				this._io.sockets.emit('editor:change', {});
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
			console.error('Main exiting: ', error);
			this.destroy();
			process.exit(1);
		};

		process.on('SIGTERM', processExitHandler);
		process.on('SIGINT', processExitHandler);
		process.on('unhandledRejection', processExitHandler);
	}

	private _killAllChildProcesses() {
		this.controllers.instrument.destroyAll();
		this.controllers.cache.destroy();
	}

	destroy(): void {
		winston.info('Shutting down and cleaning up child processes');
		this.debug('warning', 'Shutting down server');

		this._killAllChildProcesses();

		// this._httpApi.close();
		this._httpApi = null;
		this._http = null;
		this._io = null;
	}
}
