import * as _http from 'http';
import {json, urlencoded} from 'body-parser';
import * as express from 'express';
import * as _io from 'socket.io';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import * as mongoose from 'mongoose';
import bodyParser = require('body-parser');
import {toolsController} from './controllers/tools.controller';

const
	config = require('../../tradejs.config'),
	app = express(),
	http = _http.createServer(app),
	io = _io.listen(http),
	db = mongoose.connection;

mongoose.Promise = global.Promise;
mongoose.connect(config.server.social.connectionString);

// handle mongo error
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
	console.log('DB CONNECTED');
});

app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});

// default options
app.use(morgan('dev'));
app.use(helmet());
app.use(json());
app.use(bodyParser.urlencoded({extended: false}));
app.use((req: any, res, next) => {
	let userId = req.headers['_id'];

	if (!userId && req.originalUrl !== '/social/authenticate' &&
		// !(req.originalUrl === '/social/file-upload/profile' && req.method === 'OPTIONS') &&
		!(req.originalUrl === '/social/user' && req.method === 'POST'))
		return res.status(400).send('Invalid request');

	req.user = {id: userId};
	next();
});

app.use('/social/authenticate', require('./api/authenticate'));
app.use('/social/user', require('./api/user'));
app.use('/social/follow', require('./api/follow'));
app.use('/social/users', require('./api/users'));
app.use('/social/trading-channels', require('./api/trading_channels'));
app.use('/social/search', require('./api/search'));
app.use('/social/file-upload', require('./api/file-upload'));

// Application routes (WebSockets)
io.on('connection', socket => {
	console.info('App', `connectfion from ${socket.handshake.headers.origin}`);
});

http.listen(config.server.social.port, () => console.log(`\n Social service started on      : 127.0.0.1:${config.server.social.port}`));


// toolsController.updateFieldType(User, 'followers', 'following', 'array');

