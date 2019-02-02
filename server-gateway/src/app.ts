import * as path from 'path';
import { parse } from 'url';
import { json } from 'body-parser';
import * as express from 'express';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import * as io from 'socket.io';
import { symbolController } from './controllers/symbol.controller';
import { BrokerMiddleware } from 'coinpush/src/broker';
import { log } from 'coinpush/src/util/util.log';
import { subClient } from 'coinpush/src/redis';
import * as expressJwt from 'express-jwt';
import * as jwt from 'jsonwebtoken';
import { config } from 'coinpush/src/util/util-config';
import { G_ERROR_MAX_SIZE, G_ERROR_UNKNOWN } from 'coinpush/src/constant';
import { userController } from './controllers/user.controller';

const PATH_WWW_BROWSER_NOT_SUPPORTED_FILE = path.join(__dirname, '../public/index.legacy.browser.html');

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
	clientConfig: {},

	_symbolUpdateTimeout: null,
	_symbolUpdateTimeoutTime: 60 * 1000, // 1 minute
	_socketTickInterval: null,
	_socketTickIntervalTime: 500,

	async init(): Promise<void> {
		this._setRedisListeners();

		// load symbols
		symbolController.init();

		this._toggleWebSocketTickInterval();

		// http / websocket api
		this._setClientConfig();
		this._setupApi();
	},

	async _setClientConfig() {
		this.clientConfig.companyUsers = await userController.findMany({}, {companyId: true, fields: ['name', 'img']});
		console.log(this.clientConfig.companyUsers, 2);
	},

	_setRedisListeners() {
		// if (!subClient.isConnected) {
		// 	await new Promise((resolve, reject) => {
		// 		subClient.on("connect", function () {
		// 			resolve();
		// 		});
		// 	});
		// }

		subClient.subscribe('ticks');
		subClient.subscribe('socket-notification');

		subClient.on('message', (channel, message) => {
			const object = JSON.parse(message);

			switch (channel) {
				case 'socket-notification':
					const clients = this.io.sockets.sockets;
					for (let key in clients) {
						if (clients[key].userId === object.data.__userId)
							clients[key].emit('notification', object.data);
					}
					break;
				case 'ticks':
					symbolController.symbolSyncer.onTick(object);
					this.io.sockets.emit('ticks', object);
					break;
			}
		});
	},

	_setupApi(): void {
		// http 
		this.api = express();
		const http = require('http').Server(this.api);

		// websocket
		this.io = io(http);
		// this.io.use((socket, next) => {
		// 	socket.userId = socket.handshake.query.userId;

		// 	// return the result of next() to accept the connection.
		// 	// if (socket.handshake.query.foo == "bar") {
		// 	return next();
		// 	// }
		// 	// call next() with an Error if you need to reject the connection.
		// 	// next(new Error('Authentication error'));
		// });
		this.io.on('connection', socket => require('./api/socket.api')(socket));

		/**
		 *
		 * body parsing (json) - needs this middleware for form-multipart (file-upload) to work
		 */
		const isMultipartRequest = function (req) {
			let contentTypeHeader = req.headers['content-type'];
			return contentTypeHeader && contentTypeHeader.indexOf('multipart') > -1;
		};

		const bodyParserJsonMiddleware = function () {
			return function (req, res, next) {
				if (isMultipartRequest(req)) {
					return next();
				}
				return json()(req, res, next);
			};
		};

		this.api.use(bodyParserJsonMiddleware());
		this.api.use(morgan('dev'));
		this.api.use(helmet());

		this.api.use((req, res, next) => {
			res.header('Access-Control-Allow-Origin', '*');
			// res.header('Access-Control-Allow-Headers', 'clientVersion, Authorization, Origin, X-Requested-With, Content-Type, Accept');
			next();
		});

		// use JWT auth to secure the api, the token can be passed in the authorization header or query string
		const getToken = function (req) {
			if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer')
				return req.headers.authorization.split(' ')[1];
		};

		this.api.use(expressJwt({
			secret: config.auth.jwt.secret || 'liefmeisje',
			getToken,
			credentialsRequired: true
		}).unless(req => {
			return (
				(req.method === 'GET' && !req.originalUrl.startsWith('/api/v1/authenticate')) ||
				(req.originalUrl.startsWith('/api/v1/authenticate') && !getToken(req)) ||
				(req.originalUrl === '/api/v1/user' && req.method === 'POST')
			);
		}));

		/**
		 * error - unauthorized
		 */
		this.api.use((err, req, res, next) => {
			if (err.name === 'UnauthorizedError')
				return res.status(401).send('invalid token...');

			next();
		});


		/**
		 * set client user id for upcoming (proxy) requests
		 */
		this.api.use((req, res, next) => {

			if (req.user) {
				req.headers._id = req.user.id;
				next();
			} else {
				const token = getToken(req);

				if (token) {
					jwt.verify(token, config.auth.jwt.secret || 'liefmeisje', {}, (error, decoded) => {
						if (error) {
							res.status(401);
						} else {
							req.user = decoded;
							next();
						}
					});
				} else {
					req.user = {};
					next();
				}
			}
		});


		/**
		 * error - unauthorized
		 */
		// this.api.use((req, res, next) => {
		// 	if (!req.headers.cv || req.headers.cv !== config.clientVersion)
		// 		return res.status(400).send({ reason: 'clientVersion' });

		// 	next();
		// });

		// this.api.get('/', function (req, res, next) {
		// 	res.send('This page has been viewed ' + 3 + ' times!');
		// });

		/**
		 * symbol
		 */
		this.api.use('/api/v1/symbol', require('./api/symbol.api'));

		/**
		 * cache
		 */
		this.api.use('/api/v1/cache', require('./api/cache.api'));

		/**
		 * authenticate
		 */
		this.api.use('/api/v1/authenticate', require('./api/authenticate.api'));

		/**
		 * device
		 */
		this.api.use('/api/v1/device', require('./api/device.api'));

		/**
		 * notification
		 */
		this.api.use('/api/v1/notify', require('./api/notify.api'));

		/**
		 * upload
		 */
		this.api.use('/api/v1/upload', require('./api/upload.api').router);

		/**
		 * user
		 */
		this.api.use('/api/v1/user', require('./api/user.api'));

		/**
		 * timeline
		 */
		this.api.use('/api/v1/timeline', require('./api/timeline.api'));

		/**
		 * comment
		 */
		this.api.use('/api/v1/comment', require('./api/comment.api'));
		this.api.use('/api/v1/comment/*', require('./api/comment.api'));

		/**
		 * event
		 */
		this.api.use('/api/v1/event', require('./api/event.api'));

		/**
		 * search
		 */
		this.api.use('/api/v1/search', require('./api/search.api'));

		/**
		 * favorite
		 */
		this.api.use('/api/v1/favorite', require('./api/favorite.api'));

		/**
		 * error handling
		 */
		this.api.use((error, req, res, next) => {			
			if (res.headersSent) {
				log.error('API', error);
				return next(error);
			}
			
			// normal error objects
			if (error && (error.code || error.statusCode)) {
				
				// known error
				if (error.statusCode) {
					return res.status(error.statusCode).send(error.error || {
						statusCode: error.statusCode,
						message: error.message
					});
				}
					
				// custom error
				switch (parseInt(error.code, 10)) {
					case G_ERROR_MAX_SIZE:
						res.status(413).send(error);
						break;
					default:
						log.error('ErrorHandler', error.message || error.error || 'Unknown error');
						res.status(500).send({
							code: G_ERROR_UNKNOWN,
							message: 'Unknown error'
						});
				}
			}

			// unknown error
			else {
				log.error('API', error);
				res.status(500).send('Unknown server error');
			}
		});

		const server = http.listen(config.server.gateway.port, '0.0.0.0', () => log.info('App', `Service started -> 0.0.0.0:${config.server.gateway.port}`));
	},

	_toggleWebSocketTickInterval(state: boolean) {
		if (!state)
			return clearInterval(this._socketTickInterval);

		this._socketTickInterval = setInterval(() => {
			// if (!Object.keys(cacheController.tickBuffer).length)
			// 	return;

			// const JSONString = JSON.stringify(cacheController.tickBuffer);

			// this.io.sockets.emit('ticks', JSONString);
			// client.publish('ticks', JSONString);

			// cacheController.tickBuffer = {};
		}, this._socketTickIntervalTime);
	}
};