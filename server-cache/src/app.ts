import * as _http from 'http';
import { json, urlencoded } from 'body-parser';
import * as express from 'express';
import * as helmet from 'helmet';
import * as mongoose from 'mongoose';
import * as morgan from 'morgan';
import { cacheController } from './controllers/cache.controller';
import { symbolController } from './controllers/symbol.controller';
import { BrokerMiddleware } from 'coinpush/src/broker';
import { BROKER_GENERAL_TYPE_OANDA, BROKER_GENERAL_TYPE_CC , BROKER_GENERAL_TYPE_IEX} from 'coinpush/src/constant';
import { pubClient } from 'coinpush/src/redis';
import { log } from 'coinpush/src/util/util.log';
import { config } from 'coinpush/src/util/util-config';

// error catching
process.on('unhandledRejection', (reason, p) => {
	console.log('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason);
	throw reason;
});

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

		// broker
		this.broker = new BrokerMiddleware();
		this.broker.on('tick', cacheController.onTick.bind(cacheController));
		await this.broker.setSymbols();

		// http api
		this._setupApi();

		// tick to clients
		this._toggleWebSocketTickInterval(true);

		// cache + symbols syncing
		await Promise.all([
			cacheController.sync(BROKER_GENERAL_TYPE_OANDA).then(() => this.broker.openTickStream(['oanda'])),
			cacheController.sync(BROKER_GENERAL_TYPE_CC).then(() => this.broker.openTickStream(['cc'])),
			cacheController.sync(BROKER_GENERAL_TYPE_IEX).then(() => this.broker.openTickStream(['iex']))
		]);

		this._toggleSymbolUpdateInterval(true);
	},

	_setupApi(): void {
		// http 
		this.api = express();
		const server = this.api.listen(config.server.cache.port, '0.0.0.0', () => log.info('App', `Service started -> 0.0.0.0:${config.server.cache.port}`));

		this.api.use(morgan('dev'));
		this.api.use(helmet());

		this.api.use((req, res, next) => {
			res.header('Access-Control-Allow-Origin', '*');
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

			res.status(500).send(error);
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

		const timeoutFunc:any = async function() {
			try {
				await Promise.all([
					cacheController.sync(BROKER_GENERAL_TYPE_OANDA),
					cacheController.sync(BROKER_GENERAL_TYPE_CC)
				]);
				console.log('SYNC DONE!!')
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


