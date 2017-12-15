import * as _http from 'http';
import {json, urlencoded} from 'body-parser';
import * as express from 'express';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import * as mongoose from 'mongoose';
import OandaApi from '../../shared/brokers/oanda/index';
import {orderController} from './controllers/order.controller';

const config = require('../../tradejs.config');
const app = express();
const http = _http.createServer(app);

/**
 *  DB
 */
const db = mongoose.connection;
(<any>mongoose).Promise = global.Promise;
mongoose.connect(config.server.order.connectionString, { useMongoClient: true });

// handle mongo error
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
	console.log('DB CONNECTED');
});

/**
 * Broker API
 */
orderController.init().catch(console.error);

app.use(morgan('dev'));
app.use(helmet());
app.use(json());
app.use(urlencoded({extended: false}));

/**
 * Add 'user' variable to request, holding userID
 */
app.use((req: any, res, next) => {
	let userId = req.headers['_id'];

	if (!userId)
		res.status(400).send('Invalid request: _id header is missing');

	req.user = {id: userId};
	next();
});

app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', '_id, Authorization, Origin, X-Requested-With, Content-Type, Accept');
	next();
});

app.use('/order', require('./api/order.api'));

http.listen(config.server.order.port, () => console.log(`\n Order service started on      : 127.0.0.1:${config.server.order.port}`));

