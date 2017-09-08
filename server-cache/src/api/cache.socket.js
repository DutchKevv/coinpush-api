"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_controller_1 = require("../controllers/cache.controller");
module.exports = (socket) => {
    socket.on('read', async (params, cb) => {
        try {
            cb(null, await cache_controller_1.cacheController.find(params));
        }
        catch (error) {
            console.error(error);
            cb(error);
        }
    });
    socket.on('symbol:list', async (params, cb) => {
        cb(null, cache_controller_1.cacheController.symbols);
    });
};
//# sourceMappingURL=cache.socket.js.map