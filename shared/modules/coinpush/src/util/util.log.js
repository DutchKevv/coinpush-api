"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var winston = require("winston");
var path = require("path");
var fs = require("fs");
var PROCESS_MAIN_FILE = require.main.filename, // https://github.com/nodejs/node/issues/21143
// PROCESS_MAIN_FILE = Object.keys(require.cache)[0], // https://github.com/nodejs/node/issues/21143
PATH_LOG_DIR = path.join(path.dirname(PROCESS_MAIN_FILE), '../_log'), PATH_LOG_COMMON_FILE = path.join(PATH_LOG_DIR, 'common.log'), PATH_LOG_ERROR_FILE = path.join(PATH_LOG_DIR, 'error.log'), OWNER_MIN_LENGTH = 20;
// create directory if not exists
if (!fs.existsSync(PATH_LOG_DIR))
    fs.mkdirSync(PATH_LOG_DIR);
function formatString(ownerName, messages) {
    return ownerName + ' : '.padStart(Math.max(OWNER_MIN_LENGTH - ownerName.length, 0)) + messages.join();
}
var logger = winston.createLogger({
    transports: [
        new winston.transports.File({ filename: PATH_LOG_ERROR_FILE, level: 'error' }),
        new winston.transports.File({ filename: PATH_LOG_COMMON_FILE })
    ],
    exitOnError: false
});
// add console output in development mode
if (!(process.env.NODE_ENV || '').startsWith('prod')) {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}
exports.log = {
    info: function (owner) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        logger.info(formatString(owner, params));
    },
    warn: function (owner) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        logger.warn(formatString(owner, params));
    },
    error: function (owner) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        logger.error(formatString(owner, params));
    }
};
