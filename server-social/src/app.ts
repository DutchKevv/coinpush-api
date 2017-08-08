import * as _http from 'http';
import {json, urlencoded} from 'body-parser';
import * as express from 'express';
import * as _io from 'socket.io';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import * as mongoose from 'mongoose';
import bodyParser = require('body-parser');

const
	config = require('../config'),
	app = express(),
	http = _http.createServer(app),
	io = _io.listen(http),
	tradingChannelsAPI = require('./api/trading_channels'),
	usersAPI = require('./api/users'),
	db = mongoose.connection;

mongoose.Promise = global.Promise;
mongoose.connect(config.connectionString);

// handle mongo error
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
	console.log('DB CONNECTED');
});


app.use(morgan('dev'));
app.use(helmet());
app.use(json());
app.use(bodyParser.urlencoded({extended: false}));
app.use((req: any, res, next) => {
	let userId = req.headers['_id'];

	if (!userId && req.originalUrl !== '/social/authenticate' && !(req.originalUrl === '/social/users' && req.method === 'POST'))
		res.status(400).send('Invalid request');

	req.user = {id: userId};
	next();
});

app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', '_id, Authorization, Origin, X-Requested-With, Content-Type, Accept');
	next();
});

app.use('/social/authenticate', require('./api/authenticate'));
app.use('/social/users', usersAPI);
app.use('/social/trading-channels', tradingChannelsAPI);

// Application routes (WebSockets)
io.on('connection', socket => {
	console.info('App', `connectfion from ${socket.handshake.headers.origin}`);
});

http.listen(config.port, () => console.log(`\n Social service started on      : 127.0.0.1:${config.port}`));

