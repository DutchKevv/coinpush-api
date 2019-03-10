"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const util_log_1 = require("../util/util.log");
exports.defaults = {
    host: 'redis',
    port: 6379,
    reconnectAttempts: 1000
};
exports.createRedisClient = function (config = {}) {
    const options = {
        host: config.host || exports.defaults.host,
        port: config.port || exports.defaults.port,
        retry_strategy: function (options) {
            util_log_1.log.info('redis ', 'connection error, retry attempt: ' + options.attempt);
            if (options.error && options.error.code === 'ECONNREFUSED') {
                // End reconnecting on a specific error and flush all commands with 
                // a individual error 
                return new Error('The server refused the connection');
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
                // End reconnecting after a specific timeout and flush all commands 
                // with a individual error 
                return new Error('Retry time exhausted');
            }
            if (options.attempt > exports.defaults.reconnectAttempts) {
                console.log('MAX ATTEMPTS!');
                // End reconnecting with built in error 
                return undefined;
            }
            // reconnect after 
            return Math.min(options.attempt * 100, 3000);
        }
    };
    console.log(options);
    const client = redis_1.createClient(options);
    client.on('connect', () => {
        util_log_1.log.info('redis', 'client connected');
    });
    return client;
};
exports.pubClient = exports.createRedisClient();
exports.subClient = exports.createRedisClient();
