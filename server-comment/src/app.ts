import * as express from 'express';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import * as mongoose from 'mongoose';
import {json, urlencoded} from 'body-parser';
import { config } from '../../shared/modules/coinpush/src/util/util-config';
import { log } from '../../shared/modules/coinpush/src/util/util.log';
import { NewsAggregator } from './news/news.aggregator';

export const app = {

	async init(): Promise<void> {
		this._connectMongo();
		this._setupApi();

		this._newsAggregator = new NewsAggregator();
		this._newsAggregator.start();
	},

	_setupApi(): void {
		// http 
		this.api = express();
		const server = this.api.listen(config.server.comment.port, '0.0.0.0', () => log.info('App', `Service started -> 0.0.0.0:${config.server.comment.port}`));

		// this.api.use(morgan('dev'));
		this.api.use(helmet());

		this.api.use((req, res, next) => {
			res.header('Access-Control-Allow-Origin', '*');
			next();
		});

		this.api.use((req: any, res, next) => {
			req.user = { id: req.headers['_id'] };
			next();
		});

		this.api.use(json());

		// app.use((req: any, res, next) => {
		// 	req.user = {id: req.headers['_id']};
		// 	next();
		// });
		
		this.api.use('/user', require('./api/user.api'));
		this.api.use('/comment', require('./api/comment.api'));
		this.api.use('/timeline', require('./api/timeline.api'));

		/**
		 * error handling
		 */
		this.api.use((error, req, res, next) => {
			if (res.headersSent)
				return next(error);

				console.error(error);

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

			mongoose.connect(config.server.comment.connectionString, (error) => {
				if (error)
					return reject(error);
				
				resolve();
			});
		});
	}
};


// const app = express();
// app.listen(config.server.comment.port, '0.0.0.0', () => console.log(`\n Comment service started on      : 0.0.0.0:${config.server.comment.port}`));

// mongoose.set('debug', true);
// (<any>mongoose).Promise = global.Promise;
// mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
// mongoose.connection.once('open', function () {
// 	console.log('DB connected');
// });
// mongoose.connect(config.server.comment.connectionString);

/**
 * Express
 */
// app.use(morgan('dev'));
// app.use(helmet());
// app.use(json());
// app.use(urlencoded({extended: false}));
// app.use(function (req, res, next) {
// 	res.header('Access-Control-Allow-Origin', '*');
// 	res.header('Access-Control-Allow-Headers', '_id, Authorization, Origin, X-Requested-With, Content-Type, Accept');
// 	next();
// });

/**
 * Add 'user' variable to request, holding userID
 */