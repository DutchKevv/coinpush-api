"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require("../modules/redis");
const order_1 = require("../schemas/order");
const config = require('../../../tradejs.config');
exports.orderController = {
    brokers: {
        oanda: global['brokerAPI']
    },
    find() {
    },
    findById(id) {
        return order_1.Order.findById(id);
    },
    async findByUserId(userId) {
        return order_1.Order.find({ user: userId }).limit(50);
    },
    async create(params) {
    },
    createForFollowers(followers) {
        Promise.resolve().then(() => {
        }).catch(error => {
        });
    },
    update() {
    },
    remove() {
    },
    async getCached(key, fields) {
        return new Promise((resolve, reject) => {
            redis.client.get(key, function (err, reply) {
                if (err)
                    reject(err);
                else
                    resolve(JSON.parse(reply));
            });
        });
    },
};
//# sourceMappingURL=order.controller.js.map