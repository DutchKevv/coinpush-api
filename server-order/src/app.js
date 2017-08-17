"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _http = require("http");
const body_parser_1 = require("body-parser");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const index_1 = require("../../shared/brokers/oanda/index");
const config = require('../../tradejs.config');
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
const brokerAPI = global['brokerAPI'] = new index_1.default(config.broker.account);
brokerAPI.init();
app.use(morgan('dev'));
app.use(helmet());
app.use(body_parser_1.json());
app.use(body_parser_1.urlencoded({ extended: false }));
/**
 * Add 'user' variable to request, holding userID
 */
app.use((req, res, next) => {
    let userID = req.headers['_id'];
    if (!userID)
        res.status(400).send('Invalid request: _id header is missing');
    req.user = { id: userID };
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
//# sourceMappingURL=app.js.map