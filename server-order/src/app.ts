import * as _http from 'http';
import {json, urlencoded} from 'body-parser';
import * as express from 'express';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import * as mongoose from 'mongoose';
import OandaApi from '../../shared/brokers/oanda/index';

const config = require('../../tradejs.config.json');
const app = express();
const http = _http.createServer(app);
const db = mongoose.connection;

/**
 *  Database
 */
mongoose.Promise = global.Promise;
mongoose.connect(config.server.order.connectionString);

// handle mongo error
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
	console.log('DB CONNECTED');
});

/**
 * Broker API
 */
const brokerAPI = global['brokerAPI'] = new OandaApi(config.broker.account);
brokerAPI.init();

app.use(morgan('dev'));
app.use(helmet());
app.use(json());
app.use(urlencoded({extended: false}));

/**
 * Add 'user' variable to request, holding userID
 */
app.use((req: any, res, next) => {
	let userID = req.headers['_id'];

	if (!userID)
		res.status(400).send('Invalid request: _id header is missing');

	req.user = {id: userID};
	next();
});

app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', '_id, Authorization, Origin, X-Requested-With, Content-Type, Accept');
	next();
});

app.use('/order', require('./api/order'));
app.use('/orders', require('./api/orders'));

http.listen(config.server.order.port, () => console.log(`\n Order service started on      : 127.0.0.1:${config.server.order.port}`));

