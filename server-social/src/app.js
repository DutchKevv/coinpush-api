"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _http = require("http");
const body_parser_1 = require("body-parser");
const express = require("express");
const _io = require("socket.io");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const config = require('../config'), app = express(), http = _http.createServer(app), io = _io.listen(http), db = mongoose.connection;
mongoose.Promise = global.Promise;
mongoose.connect(config.connectionString);
// handle mongo error
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('DB CONNECTED');
});
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '_id, Authorization, Origin, X-Requested-With, Content-Type, Accept');
    next();
});
app.use(morgan('dev'));
app.use(helmet());
app.use(body_parser_1.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use((req, res, next) => {
    let userId = req.headers['_id'];
    if (!userId && req.originalUrl !== '/social/authenticate' && !(req.originalUrl === '/social/user' && req.method === 'POST'))
        return res.status(400).send('Invalid request');
    req.user = { id: userId };
    next();
});
app.use('/social/authenticate', require('./api/authenticate'));
app.use('/social/user', require('./api/user'));
app.use('/social/follow', require('./api/follow'));
app.use('/social/users', require('./api/users'));
app.use('/social/trading-channels', require('./api/trading_channels'));
app.use('/social/search', require('./api/search'));
// Application routes (WebSockets)
io.on('connection', socket => {
    console.info('App', `connectfion from ${socket.handshake.headers.origin}`);
});
http.listen(config.port, () => console.log(`\n Social service started on      : 127.0.0.1:${config.port}`));
// toolsController.updateFieldType(User, 'followers', 'following', 'array');
//# sourceMappingURL=app.js.map