"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url = require("url");
const request = require("request-promise");
const redis = require("../modules/redis");
const order_1 = require("../schemas/order");
const constants_1 = require("../../../shared/constants/constants");
const index_1 = require("../../../shared/brokers/oanda/index");
const config = require('../../../tradejs.config');
exports.orderController = {
    find(reqUser) {
    },
    findById(reqUser, id) {
        return order_1.Order.findById(id);
    },
    async findByUserId(reqUser, userId) {
        return order_1.Order.find({ user: userId }).limit(50);
    },
    async create(params) {
        try {
            // Get user that created order
            const user = await this._getUser(params.user);
            // Create a new broker class
            // TODO : Refactor
            const broker = new index_1.default({
                // accountId: user.brokerAccountId,
                // token: user.brokerToken
                accountId: config.broker.account.accountId,
                token: config.broker.account.token
            });
            await broker.init();
            // Place order and merge result
            Object.assign(params, await broker.placeOrder(params));
            // Create order model from result
            const order = await order_1.Order.create(params);
            redis.client.publish('order-created', JSON.stringify(order));
            return order;
        }
        catch (error) {
            console.error('ORDER CREATE : ', error);
            switch (error.code) {
                case constants_1.BROKER_OANDA_ERROR_INVALID_ARGUMENT:
                    throw ({
                        code: constants_1.BROKER_ERROR_INVALID_ARGUMENT,
                        message: 'Invalid argument in http request '
                    });
                case constants_1.BROKER_OANDA_ERROR_MARKET_CLOSED:
                    throw ({
                        code: constants_1.BROKER_ERROR_MARKET_CLOSED,
                        message: 'Market closed'
                    });
                default:
                    console.error(error);
                    throw ({
                        code: constants_1.BROKER_ERROR_UNKNOWN,
                        error: 'undocumented error occurred'
                    });
            }
        }
    },
    update() {
    },
    async close(reqUser, orderId) {
        try {
            // Create a new broker class
            // TODO : Refactor
            const broker = new index_1.default({
                // accountId: user.brokerAccountId,
                // token: user.brokerToken
                accountId: config.broker.account.accountId,
                token: config.broker.account.token
            });
            await broker.init();
            await broker.closeOrder(tradeId);
            redis.client.publish('order-closed', JSON.stringify(order));
            return order;
        }
        catch (error) {
            console.error('ORDER CREATE : ', error);
            switch (error.code) {
                case constants_1.BROKER_OANDA_ERROR_INVALID_ARGUMENT:
                    throw ({
                        code: constants_1.BROKER_ERROR_INVALID_ARGUMENT,
                        message: 'Invalid argument in http request '
                    });
                case constants_1.BROKER_OANDA_ERROR_MARKET_CLOSED:
                    throw ({
                        code: constants_1.BROKER_ERROR_MARKET_CLOSED,
                        message: 'Market closed'
                    });
                default:
                    console.error(error);
                    throw ({
                        code: constants_1.BROKER_ERROR_UNKNOWN,
                        error: 'undocumented error occurred'
                    });
            }
        }
    },
    async _getUser(userId) {
        try {
            return await this.getCached(userId);
        }
        catch (error) {
            console.error(error);
        }
        return await request({
            uri: url.resolve(config.server.social.apiUrl, 'social/user/' + userId),
            qs: {
                type: constants_1.USER_FETCH_TYPE_BROKER_DETAILS
            },
            json: true
        });
    },
    async getCached(userId, fields) {
        return new Promise((resolve, reject) => {
            redis.client.get(constants_1.REDIS_USER_PREFIX + userId, function (err, reply) {
                if (err)
                    reject(err);
                else
                    resolve(JSON.parse(reply));
            });
        });
    },
};
//# sourceMappingURL=order.controller.js.map