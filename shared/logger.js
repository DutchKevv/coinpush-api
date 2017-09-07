"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const win = require("winston");
const path = require("path");
const fs = require("fs");
const mkdirp = require("mkdirp");
const PATH_SERVER_LOG = path.join('_logs', '/server.txt'), OWNER_MIN_LENGTH = 20;
if (!fs.existsSync(PATH_SERVER_LOG)) {
    mkdirp.sync(PATH_SERVER_LOG);
}
function ensureStringLength(str) {
    while (str.length < OWNER_MIN_LENGTH) {
        str += ' ';
    }
    return str;
}
const logger = new win.Logger({
    transports: [
        new win.transports.File({
            level: 'info',
            filename: 'server.txt',
            json: false,
            maxsize: 5242880,
            maxFiles: 2,
            colorize: false
        }).on('error', function (err) {
            console.error(err.stack);
        }),
        new win.transports.Console({
            level: 'debug',
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});
exports.log = {
    info(owner, ...params) {
        logger.info(ensureStringLength(owner) + ' : ', ...params);
    },
    warn(owner, ...params) {
        logger.warn(ensureStringLength(owner) + ' : ', ...params);
    },
    error(owner, ...params) {
        logger.error(ensureStringLength(owner) + ' : ', ...params);
    }
};

//# sourceMappingURL=logger.js.map
