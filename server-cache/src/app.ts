import * as _http from 'http';
import { json, urlencoded } from 'body-parser';
import * as express from 'express';
import * as helmet from 'helmet';
import * as mongoose from 'mongoose';
import * as morgan from 'morgan';
import * as io from 'socket.io';
import { cacheController } from './controllers/cache.controller';
import { symbolController } from './controllers/symbol.controller';
import { BrokerMiddleware } from '../../shared/brokers/broker.middleware';
import { clearInterval } from 'timers';
import { client } from './modules/redis';
import { log } from '../../shared/logger';

// error catching
process.on('unhandledRejection', (reason, p) => {
	console.log('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason);
	throw reason;
});

// configuration
const config = require('../../tradejs.config');

export const app = {

	db: null,
	api: null,
	io: null,
	broker: <BrokerMiddleware>null,

	_symbolUpdateTimeout: null,
	_symbolUpdateTimeoutTime: 60 * 1000, // 1 minute
	_socketTickInterval: null,
	_socketTickIntervalTime: 500,

	async init(): Promise<void> {
		// database
		await this._connectMongo();

		// broker
		this.broker = new BrokerMiddleware();
		await this.broker.setSymbols()

		// cache + symbols syncing
		await cacheController.sync(false);
		await symbolController.setLastKnownPrices(); // only needed at start
		await symbolController.update();

		this._toggleSymbolUpdateInterval(true);
		this._toggleWebSocketTickInterval(true);

		// this.broke;
		await this.broker.on('tick', cacheController.onTick.bind(cacheController)).openTickStream(app.broker.symbols.map(symbol => symbol.name));

		// http / websocket api
		this._setupApi();
	},

	_setupApi(): void {
		// http 
		this.api = express();
		const server = this.api.listen(config.server.cache.port, () => console.log(`\n Cache service started on      : 127.0.0.1:${config.server.cache.port}`));

		// websocket
		this.io = io(server, { path: '/ws/candles' }).listen(server);
		this.io.on('connection', socket => require('./api/cache.socket')(socket));

		this.api.use(morgan('dev'));
		this.api.use(helmet());

		this.api.use((req, res, next) => {
			res.header('Access-Control-Allow-Origin', '*');
			res.header('Access-Control-Allow-Headers', '_id, Authorization, Origin, X-Requested-With, Content-Type, Accept');
			next();
		});

		/**
		 * error handling
		 */
		this.api.use((error, req, res, next) => {
			if (res.headersSent)
				return next(error);

			if (error && error.statusCode) {
				res.status(error.statusCode).send(error.error);

				if (error.message)
					console.error(error.message);

				return;
			}

			res.status(500).send({ error });
		});
	},

	_connectMongo() {
		return new Promise((resolve, reject) => {
			// mongoose.set('debug', process.env.NODE_ENV === 'development');
			(<any>mongoose).Promise = global.Promise; // Typescript quirk

			this.db = mongoose.connection;
			this.db.on('error', error => {
				console.error('connection error:', error);
				reject();
			});
			this.db.once('open', () => {
				console.log('Cache DB connected');
				resolve();
			});

			mongoose.connect(config.server.cache.connectionString, { useMongoClient: true });
		});
	},

	_toggleSymbolUpdateInterval(state: boolean) {
		if (!state)
			return clearInterval(this._symbolUpdateInterval);

		const timeoutFunc = async function () {
			try {
				await cacheController.sync();

				client.set('symbols', JSON.stringify(this.broker.symbols), err => {
					console.log(err)
				});
			} catch (error) {
				console.error(error);
			} finally {
				this._symbolUpdateTimeout = setTimeout(timeoutFunc, this._symbolUpdateTimeoutTime);
			}
		}.bind(this);

		this._symbolUpdateTimeout = setTimeout(() => timeoutFunc(), this._symbolUpdateTimeoutTime);
	},

	_toggleWebSocketTickInterval(state: boolean) {
		if (!state)
			return clearInterval(this._socketTickInterval);

		this._socketTickInterval = setInterval(() => {
			if (!Object.keys(cacheController.tickBuffer).length)
				return;

			const JSONString = JSON.stringify(cacheController.tickBuffer);

			this.io.sockets.emit('ticks', JSONString);
			// client.publish('ticks', JSONString);

			cacheController.tickBuffer = {};
		}, this._socketTickIntervalTime);
	}
};


