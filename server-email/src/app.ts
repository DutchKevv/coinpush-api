import * as express from 'express';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import {json, urlencoded} from 'body-parser';

const config = require('../../tradejs.config');
const app = express();
app.listen(config.server.email.port, () => console.log(`\n Email service started on      : 127.0.0.1:${config.server.email.port}`));

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

app.use('/mail', require('./api/email.api'));
app.use('/user', require('./api/user.api'));

app.use((error, req, res, next) => {
	console.error(error);

	if (res.headersSent)
		return next(error);

	if (error && error.statusCode === 401)
		return res.send(401);

	res.status(500).send({error});
});