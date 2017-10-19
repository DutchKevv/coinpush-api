import * as _http from 'http';
import {json, urlencoded} from 'body-parser';
import * as express from 'express';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import {cacheController} from './controllers/cache.controller';
import OandaApi from "../../shared/brokers/oanda/index";
import {symbolController} from "./controllers/symbol.controller";

const config = require('../../tradejs.config');
const app = express();
const server = app.listen(config.server.cache.port, () => console.log(`\n Cache service started on      : 127.0.0.1:${config.server.cache.port}`));

/**
 * WebSocket
 */
const io = require('socket.io')(server, { path: '/candles' }).listen(server);
io.on('connection', socket => require('./api/cache.socket')(socket));

/**
 * Broker
 */
const brokerApi = new OandaApi(config.broker.account);
brokerApi.init();

/**
 * Controllers init
 */
(async () => {
	symbolController.init(brokerApi);
	await symbolController.setList();

	cacheController.symbols = symbolController.symbols;
	cacheController.init(brokerApi);
	cacheController.startBroadcastInterval(io);
	await cacheController.openTickStream();
})();


/**
 * Express
 */
app.use(morgan('dev'));
app.use(helmet());
app.use('/symbols', require('./api/symbol.api'));

app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', '_id, Authorization, Origin, X-Requested-With, Content-Type, Accept');
	next();
});