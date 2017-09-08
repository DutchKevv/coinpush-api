"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cache_controller_1 = require("./controllers/cache.controller");
const config = require('../../tradejs.config');
const app = express();
const server = app.listen(config.server.cache.port, () => console.log(`\n Cache service started on      : 127.0.0.1:${config.server.cache.port}`));
/**
 * SocketIO
 */
const io = require('socket.io')(server, { path: '/candles' }).listen(server);
io.on('connection', socket => require('./api/cache.socket')(socket));
/**
 * Controller init
 */
cache_controller_1.cacheController.init().then(() => cache_controller_1.cacheController.startBroadcastInterval(io)).catch(console.error);
/**
 * Express
 */
app.use(morgan('dev'));
app.use(helmet());
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '_id, Authorization, Origin, X-Requested-With, Content-Type, Accept');
    next();
});
//# sourceMappingURL=app.js.map