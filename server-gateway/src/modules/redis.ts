import * as redis from 'redis';

const config = require('../../../tradejs.config');

export const client = redis.createClient(config.redis.port, config.redis.host);

