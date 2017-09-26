"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const body_parser_1 = require("body-parser");
const config = require('../../tradejs.config');
const app = express();
app.listen(config.server.user.port, () => console.log(`\n User service started on      : 127.0.0.1:${config.server.channel.port}`));
mongoose.set('debug', true);
mongoose.Promise = global.Promise;
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function () {
    console.log('DB connected');
});
mongoose.connect(config.server.user.connectionString);
/**
 * Express
 */
app.use(morgan('dev'));
app.use(helmet());
app.use(body_parser_1.json());
app.use(body_parser_1.urlencoded({ extended: false }));
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', '_id, Authorization, Origin, X-Requested-With, Content-Type, Accept');
    next();
});
/**
 * Add 'user' variable to request, holding userID
 */
app.use((req, res, next) => {
    let userId = req.headers['_id'];
    // if (!userId)
    // 	res.status(400).send('Invalid request: _id header is missing');
    req.user = { id: userId };
    next();
});
app.use('/user', require('./api/user.api'));
app.use('/wallet', require('./api/wallet.api'));
app.use('/authenticate', require('./api/authenticate.api'));
app.use('/search', require('./api/search.api'));
//# sourceMappingURL=app.js.map