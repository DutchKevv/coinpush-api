import * as redis from 'redis';

const config = require('../../../tradejs.config');

export const createRedisClient = function() {
    return redis.createClient(config.redis.port, config.redis.host);
}

export const pubClient = createRedisClient();
export const subClient = createRedisClient();