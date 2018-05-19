import * as express from 'express';
import * as mongoose from 'mongoose';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import {json, urlencoded} from 'body-parser';

const config = require('../../tradejs.config.js');
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
app.use(urlencoded({extended: false}));
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', '_id, Authorization, Origin, X-Requested-With, Content-Type, Accept');
	next();
});

/**
 * Add 'user' variable to request, holding userID
 */
app.use((req: any, res, next) => {
	req.user = {id: req.headers['_id']};
	next();
});

app.use('/user', require('./api/user.api'));
app.use('/favorite', require('./api/favorite.api'));
app.use('/authenticate', require('./api/authenticate.api'));

/**
 * error handling
 */
app.use((error, req, res, next) => {
	console.error(error);
	
	if (res.headersSent)
		return next(error);

	if (error && error.statusCode === 401)
		return res.send(401);

	if (error.error)
		return res.status(500).send(error.error);

	res.status(500).send(error);
});