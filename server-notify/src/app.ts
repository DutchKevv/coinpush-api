import * as express from 'express';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import * as mongoose from 'mongoose';
import { json, urlencoded } from 'body-parser';
import { notifyController } from './controllers/notify.controller';
import { subClient } from 'coinpush/src/redis';
import { config } from 'coinpush/src/util/util-config';
import { G_ERROR_DUPLICATE_CODE, G_ERROR_DUPLICATE_NAME } from 'coinpush/src/constant';
import { log } from 'coinpush/src/util/util.log';

const app = express();
app.listen(config.server.notify.port, '0.0.0.0', () => console.log(`\n Notify service started on      : 0.0.0.0:${config.server.notify.port}`));

/**
 * mongo
 */
// mongoose.set('debug', true);
(<any>mongoose).Promise = global.Promise;
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function () {
	console.log('DB connected');
});
mongoose.connect(config.server.notify.connectionString);

/**
 * express
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

app.use('/notify', require('./api/notify.api'));
app.use('/mail', require('./api/email.api'));
app.use('/user', require('./api/user.api'));
app.use('/device', require('./api/device.api'));

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

subClient.subscribe("notify");
subClient.on("message", function (channel, message) {

	try {
		switch (channel) {
			case 'notify':
				notifyController.parse(JSON.parse(message));
				break;
		}
	} catch (error) {
		return console.error(error);
	}
});