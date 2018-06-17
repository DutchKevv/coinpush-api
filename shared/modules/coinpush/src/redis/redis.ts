import { createClient, RedisClient } from 'redis';
import { log } from '../util/util.log';

export const defaults = {
    host: 'redis',
    port: 6379,
    reconnectAttempts: 1000
};

export const createRedisClient = function (config: { host?: string, port?: number } = {}): RedisClient {
    
    const client = createClient({
        host: config.host || defaults.host,
        port: config.port || defaults.port,
        retry_strategy: function (options) {
            log.info('redis ', 'connection error, retry attempt: ' + options.attempt);

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
            if (options.attempt > defaults.reconnectAttempts) {
                console.log('MAX ATTEMPTS!');
                // End reconnecting with built in error 
                return undefined;
            }
            // reconnect after 
            return Math.min(options.attempt * 100, 3000);
        }
    });

    client.on('connect', () => {
        log.info('redis', 'client connected');
    });

    return client;
}

export const pubClient: RedisClient = createRedisClient();
export const subClient: RedisClient = createRedisClient();