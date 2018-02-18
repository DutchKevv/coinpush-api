import * as redis from 'redis';

const config = require('../../../tradejs.config');

export const createRedisClient = function() {
    const client = redis.createClient({
            host: 'redis',
            port: '6379',
            retry_strategy: function (options) {
                if (options.error && options.error.code === 'ECONNREFUSED') {
                    // End reconnecting on a specific error and flush all commands with 
                    // a individual error 
                    return new  Error('The server refused the connection');
                }
                if (options.total_retry_time > 1000 * 60 * 60) {
                    // End reconnecting after a specific timeout and flush all commands 
                    // with a individual error 
                    return new Error('Retry time exhausted');
                }
                if (options.attempt > 1000) {
                    console.log('MAX ATTEMPTS!');
                    // End reconnecting with built in error 
                    return undefined;
                }
                // reconnect after 
                return Math.min(options.attempt * 100, 3000);
            }
    });
   
    client.on('connect', () => {
        console.log('edis connect');
        client.isConnected - 1;
    });

    return client;
}

export const pubClient = createRedisClient();
export const subClient = createRedisClient();