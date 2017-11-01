require('source-map-support').install({handleUncaughtExceptions: true});

import * as http from 'http';
import {json, urlencoded} from 'body-parser';
import * as path from 'path';
import * as express from 'express';

import IPC from './classes/ipc/IPC';
import AccountController from './controllers/AccountController';
import SystemController from './controllers/SystemController';
import InstrumentController from './controllers/InstrumentController';
import EditorController from './controllers/EditorController';
import ConfigController from './controllers/ConfigController';
import BrokerController from './controllers/BrokerController';
import BacktestController from './controllers/BacktestController';
import {log} from '../shared/logger';
import {Base} from '../shared/classes/Base';
import {InstrumentModel} from '../shared/models/InstrumentModel';

process.stdin.resume();

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
		config: ConfigController,
		editor: EditorController,
		instrument: InstrumentController,
		system: SystemController
	} = <any>{};

	public get ipc() {
		return this._ipc;
	}

	private _ipc: IPC = null;
	private _http: any = null;
	private _io: any = null;
	private _httpApi: any = null;

	private _debugInterval = null;
	private _debugBuffer = [];
	private _debugLastMessage = null;
	private _debugMessageRepeat = 0;

	constructor(options?) {
		super(options);

		// Make sure the app can be cleaned up on termination
		this._setProcessListeners();
	}

	public async init(): Promise<any> {

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
		this.controllers.editor = new EditorController({path: config.path.custom}, this);
		this.controllers.instrument = new InstrumentController({}, this);
		this.controllers.backtest = new BacktestController({}, this);

		// Initialize controllers
		await this.controllers.system.init();
		await this.controllers.broker.init();
		// await this.controllers.cache.init();
		await this.controllers.instrument.init();
		await this.controllers.editor.init();
		await this.controllers.backtest.init();

		await this.controllers.broker.loadBrokerApi('oanda');

		this._setDebugBufferFlushInterval();

		await this._initAPI();

		this.controllers.system.update({booting: false});

		this.emit('app:ready');
	}

	public debug(type: string, text: string, data?: Object, socket?): void {
		// if (type === 'error')
		// log.error('App', text);

		let lastMessage = this._debugLastMessage;

		if (lastMessage && lastMessage.type === type && lastMessage.text === text) {
			lastMessage.count = (lastMessage.count || 0) + 1;
		} else {
			this._debugLastMessage = {type, text, data};
			this._debugBuffer.push(this._debugLastMessage);
		}
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
			log.info('App', 'API Starting');

			let port = this.controllers.config.get().system.port;

			this._httpApi = express();
			this._http = http.createServer(this._httpApi);

			this._http.listen(port);

			this._io = require('socket.io')(this._http, { path: '/ws/general/' }).listen(this._http);

			this._httpApi.use(function(req, res, next) {
				res.header('Access-Control-Allow-Origin', '*');
				res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
				res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS, DETELE');
				next();
			});

			this._httpApi.use(json());
			this._httpApi.use(urlencoded({extended: true}));

			// Application routes (WebSockets)
			this._io.on('connection', socket => {
				log.info('App', `connection from ${socket.handshake.headers.origin}`);

				require('./api/socket/system')(this, socket);
				require('./api/socket/editor')(this, socket);
				require('./api/socket/backtest')(this, socket);
				require('./api/socket/instrument')(this, socket);

				// TODO: Should not be required, client should ask for status
				socket.emit('system:state', this.controllers.system.state);

				this.debug('info', 'Connected to server');
			});

			/**
			 * Server events
			 */
			// this.controllers.cache.on('ticks', ticks => {
			// 	this._io.sockets.emit('ticks', ticks);
			// });

			this.controllers.instrument.on('instrument:status', status => {
				this._io.sockets.emit('instrument:status', status);
			});

			this.controllers.instrument.on('created', (instrument: InstrumentModel) => {
				this._io.sockets.emit('instrument:created', instrument.options);
			});

			this.controllers.editor.on('directory-list', (directoryList) => {
				this._io.sockets.emit('editor:directory-list', directoryList);
			});

			this.controllers.editor.on('runnable-list', (runnableList) => {
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
	
	private _setTimezone(timeZone) {
		return new Promise((resolve, reject) => {
			process.env.TZ = timeZone || DEFAULT_TIMEZONE;
			resolve();
		});
	}

	private _setProcessListeners() {

		const processExitHandler = (code?) => {
			try {
				this.destroy(code);
				log.info('App', 'exiting ' + code);
				process.exit(code);
			} catch (error) {
				console.error(error);
				process.exit(1);
			}
		};

		process.on('SIGTERM', processExitHandler);
		process.on('SIGINT', processExitHandler);
		process.on('exit', processExitHandler);
		process.on('beforeExit', processExitHandler);
		process.on('unhandledRejection', processExitHandler);
	}

	private _killAllChildProcesses() {
		if (!this.controllers)
			return;

		if (this.controllers.instrument)
			this.controllers.instrument.destroyAll();

		if (this.controllers.editor)
			this.controllers.editor.destroy();
	}

	destroy(code?): void {
		if (code) {
			log.error('App', 'Fatal error');
		} else {
			log.info('App', 'Shutting down and cleaning up child processes');
		}

		this._killAllChildProcesses();

		// this._httpApi.close();
		this._httpApi = null;
		this._http = null;
		this._io = null;
	}
}
