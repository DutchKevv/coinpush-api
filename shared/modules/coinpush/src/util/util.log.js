"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston = require("winston");
const path = require("path");
const fs = require("fs");
const PROCESS_MAIN_FILE = require.main.filename, // https://github.com/nodejs/node/issues/21143
// PROCESS_MAIN_FILE = Object.keys(require.cache)[0], // https://github.com/nodejs/node/issues/21143
PATH_LOG_DIR = path.join(path.dirname(PROCESS_MAIN_FILE), '_log'), PATH_LOG_COMMON_FILE = path.join(PATH_LOG_DIR, 'common.log'), PATH_LOG_ERROR_FILE = path.join(PATH_LOG_DIR, 'error.log'), OWNER_MIN_LENGTH = 20;
// create directory if not exists
if (!fs.existsSync(PATH_LOG_DIR))
    fs.mkdirSync(PATH_LOG_DIR);
function formatString(ownerName, messages) {
    return ownerName + ' : '.padStart(Math.max(OWNER_MIN_LENGTH - ownerName.length, 0)) + messages.join();
}
const logger = winston.createLogger({
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
    info(owner, ...params) {
        logger.info(formatString(owner, params));
    },
    warn(owner, ...params) {
        logger.warn(formatString(owner, params));
    },
    error(owner, ...params) {
        logger.error(formatString(owner, params));
    }
};
//# sourceMappingURL=util.log.js.map