import * as express from 'express';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import * as mongoose from 'mongoose';
import {json, urlencoded} from 'body-parser';

const config = require('../../tradejs.config');
const app = express();
app.listen(config.server.comment.port, '0.0.0.0', () => console.log(`\n Comment service started on      : 0.0.0.0:${config.server.comment.port}`));

mongoose.set('debug', true);
(<any>mongoose).Promise = global.Promise;
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function () {
	console.log('DB connected');
});
mongoose.connect(config.server.comment.connectionString);

/**
 * Express
 */
app.use(morgan('dev'));
app.use(helmet());
app.use(json());
app.use(urlencoded({extended: false}));
app.use(function (req, res, next) {
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
app.use('/comment', require('./api/comment.api'));