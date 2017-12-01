import * as _http from 'http';
import { json, urlencoded } from 'body-parser';
import * as express from 'express';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import * as io from 'socket.io';
import { cacheController } from './controllers/cache.controller';
import { symbolController } from './controllers/symbol.controller';
import { BrokerMiddleware } from '../../shared/brokers/broker.middleware';
import { clearInterval } from 'timers';

// error catching
process.on('unhandledRejection', (reason, p) => {
	console.log('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason);
	throw reason;
});

// configuration
const config = require('../../tradejs.config');

export const app = {

	api: null,
	io: null,
	broker: <BrokerMiddleware>null,

	_tickInterval: null,
	_tickIntervalTime: 1000,

	async init(): Promise<void> {

		// broker
		this.broker = new BrokerMiddleware();
		await this.broker.setSymbols()

		await cacheController.sync();
		await symbolController.update24HourStartPrice();

		// api
		this._setupApi();
		this._toggleWebSocketTickInterval(true);

		await cacheController.openTickStream();
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
		this.api.use('/symbols', require('./api/symbol.api'));

		this.api.use((req, res, next) => {
			res.header('Access-Control-Allow-Origin', '*');
			res.header('Access-Control-Allow-Headers', '_id, Authorization, Origin, X-Requested-With, Content-Type, Accept');
			next();
		});
	},

	_toggleWebSocketTickInterval(state: boolean) {
		if (!state)
			return clearInterval(this._tickInterval);

		this._tickInterval = setInterval(() => {
			this.io.sockets.emit('ticks', cacheController.tickBuffer);

			cacheController.tickBuffer = {};
		}, this._tickIntervalTime);
	}
};


