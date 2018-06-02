"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var win = require("winston");
var path = require("path");
var fs = require("fs");
var mkdirp = require("mkdirp");
var PATH_SERVER_LOG = path.join(path.dirname(require.main.filename), '_log'), PATH_SERVER_LOG_FILE = path.join(PATH_SERVER_LOG, 'server.txt'), OWNER_MIN_LENGTH = 20;
if (!fs.existsSync(PATH_SERVER_LOG)) {
    mkdirp.sync(PATH_SERVER_LOG);
}
function ensureStringLength(str) {
    while (str.length < OWNER_MIN_LENGTH) {
        str += ' ';
    }
    return str;
}
var logger = new win.Logger({
    transports: [
        new win.transports.File({
            level: 'info',
            filename: PATH_SERVER_LOG_FILE,
            json: false,
            maxsize: 10242880,
            maxFiles: 1
        }).on('error', function (err) {
            console.error(err.stack);
        }),
        new win.transports.Console({
            level: 'debug',
            json: false,
            colorize: 'all'
        })
    ],
    exitOnError: false
});
exports.log = {
    info: function (owner) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        logger.info.apply(logger, [ensureStringLength(owner) + ' : '].concat(params));
    },
    warn: function (owner) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        logger.warn.apply(logger, [ensureStringLength(owner) + ' : '].concat(params));
    },
    error: function (owner) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        logger.error.apply(logger, [ensureStringLength(owner) + ' : '].concat(params));
    }
};
