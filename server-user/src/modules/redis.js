"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require("redis");
const config = require('../../../tradejs.config');
exports.client = redis.createClient(config.redis.port, config.redis.host);
//# sourceMappingURL=redis.js.map