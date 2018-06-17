import * as express from 'express';
import * as mongoose from 'mongoose';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import { json, urlencoded } from 'body-parser';
import { config } from 'coinpush/src/util/util-config';
import { G_ERROR_DUPLICATE_CODE, G_ERROR_DUPLICATE_NAME } from 'coinpush/src/constant';
import { log } from 'coinpush/src/util/util.log';

const app = express();
app.listen(config.server.user.port, '0.0.0.0', () => console.log(`\n User service started on      : 0.0.0.0:${config.server.user.port}`));

var connectMongo = () => {
	return new Promise((resolve, reject) => {
		// mongoose.set('debug', process.env.NODE_ENV === 'development');
		(<any>mongoose).Promise = global.Promise; // Typescript quirk

		this.db = mongoose.connection;

		mongoose.connect(config.server.user.connectionString, (error) => {
			if (error) {
				console.error(error);
				return reject(error);
			}

			resolve();
		});
	});
};

connectMongo();

/**
 * Express
 */
app.use(morgan('dev'));
app.use(helmet());
app.use(json());
app.use(urlencoded({ extended: false }));
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', '_id, Authorization, Origin, X-Requested-With, Content-Type, Accept');
	next();
});

/**
 * Add 'user' variable to request, holding userID
 */
app.use((req: any, res, next) => {
	req.user = { id: req.headers['_id'] };
	next();
});

app.use('/user', require('./api/user.api'));
app.use('/favorite', require('./api/favorite.api'));
app.use('/authenticate', require('./api/authenticate.api'));

/**
 * error handling
 */
app.use((error, req, res, next) => {
	if (res.headersSent) {
		log.error('API', error);
		return next(error);
	}

	// pre-handled error
	if (error.statusCode)
		return res.status(error.statusCode).send(error);

	// to-handle error
	if (error.name === G_ERROR_DUPLICATE_NAME)
		return res.status(409).send({ code: G_ERROR_DUPLICATE_CODE, field: Object.keys(error.errors)[0] });

	// system error
	log.error('API', error);
	res.status(500).send(error || 'Unknown error');
});