import * as _http from 'http';
import { json, urlencoded } from 'body-parser';
import * as express from 'express';
import * as helmet from 'helmet';
import * as mongoose from 'mongoose';
import * as morgan from 'morgan';
import { cacheController } from './controllers/cache.controller';
import { symbolController } from './controllers/symbol.controller';
import { BrokerMiddleware } from 'coinpush/broker';
import { pubClient } from 'coinpush/redis';
import { log } from 'coinpush/util/util.log';

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
		this._connectMongo();
		// await this._connectMongo();

		// broker
		this.broker = new BrokerMiddleware();
		await this.broker.setSymbols()
		// await this.broker.setLastKnownPrices(); // only needed at start

		// http api
		this._setupApi();

		// cache + symbols syncing
		await cacheController.sync(false);

		this._toggleSymbolUpdateInterval(true);
		this._toggleWebSocketTickInterval(true);

		await this.broker.on('tick', cacheController.onTick.bind(cacheController)).openTickStream(app.broker.symbols.map(symbol => symbol.name));

	},

	_setupApi(): void {
		// http 
		this.api = express();
		const server = this.api.listen(config.server.cache.port, '0.0.0.0', () => console.log(`\n Cache service started on      : 0.0.0.0:${config.server.cache.port}`));

		this.api.use(morgan('dev'));
		this.api.use(helmet());

		this.api.use((req, res, next) => {
			res.header('Access-Control-Allow-Origin', '*');
			res.header('Access-Control-Allow-Headers', '_id, Authorization, Origin, X-Requested-With, Content-Type, Accept');
			next();
		});

		this.api.use('/cache', require('./api/cache.api'));

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

			mongoose.connect(config.server.cache.connectionString, (error) => {
				if (error)
					return reject(error);
				
				resolve();
			});
		});
	},

	_toggleSymbolUpdateInterval(state: boolean) {
		if (!state)
			return clearInterval(this._symbolUpdateInterval);

		const timeoutFunc = async function () {
			try {
				await cacheController.sync();
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

			pubClient.publish('ticks', JSON.stringify(cacheController.tickBuffer));

			const symbolData = {};
			for (let symbolName in cacheController.tickBuffer) {
				const symbol = app.broker.symbols.find(symbol => symbol.name === symbolName);

				if (symbol)
					symbolData[symbolName] = JSON.stringify(symbol);
			}

			if (Object.keys(symbolData).length)
				pubClient.HMSET('symbols', symbolData);

			cacheController.tickBuffer = {};
		}, this._socketTickIntervalTime);
	}
};


