import * as _http from 'http';
import {json, urlencoded} from 'body-parser';
import * as express from 'express';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import {cacheController} from './controllers/cache.controller';

const config = require('../../tradejs.config');
const app = express();
const server = app.listen(config.server.cache.port, () => console.log(`\n Cache service started on      : 127.0.0.1:${config.server.cache.port}`));

/**
 * SocketIO
 */
const io = require('socket.io')(server, { path: '/candles' }).listen(server);
io.on('connection', socket => require('./api/cache.socket')(socket));

/**
 * Controller init
 */
cacheController.init().then(() => cacheController.startBroadcastInterval(io)).catch(console.error);

/**
 * Express
 */
app.use(morgan('dev'));
app.use(helmet());

app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', '_id, Authorization, Origin, X-Requested-With, Content-Type, Accept');
	next();
});