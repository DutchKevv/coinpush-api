"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request-promise");
const constants_1 = require("../../../shared/constants/constants");
const user_controller_1 = require("./user.controller");
const redis = require("../modules/redis");
const config = require('../../../tradejs.config');
exports.orderController = {
    find(params) {
        return Promise.resolve([]);
    },
    async create(reqUser, params, triggerCopy = true) {
        let balance = await user_controller_1.userController.getBalance(reqUser, reqUser.id), requiredAmount = params.amount * (await this._getCurrentPrice(params.symbol)).bid;
        // check balance
        if (balance < requiredAmount)
            throw {
                code: constants_1.BROKER_ERROR_NOT_ENOUGH_FUNDS,
                message: 'Not enough funds'
            };
        // send request to order service
        const order = await request({
            uri: config.server.order.apiUrl + '/order',
            method: 'POST',
            headers: { '_id': reqUser.id },
            body: params,
            json: true
        });
        const updateResult = await user_controller_1.userController.updateBalance(reqUser, { amount: -(order.openPrice * order.amount) });
        order.balance = updateResult.balance;
        if (triggerCopy)
            this._copyOrder(order).catch(console.error);
        return order;
    },
    update(userId, params) {
    },
    async _copyOrder(order) {
        try {
            // Get user MAIN channel
            const copiers = (await request({
                uri: config.server.channel.apiUrl + '/channel/',
                method: 'GET',
                headers: { '_id': order.user },
                qs: {
                    fields: ['_id, copiers'],
                    user: order.user,
                    type: constants_1.CHANNEL_TYPE_MAIN
                },
                json: true
            })).user[0].copiers;
            copiers.forEach(copier => {
                this.create({ id: copier }, order, false).catch(console.error);
            });
        }
        catch (error) {
            console.error(error);
            return false;
        }
        return true;
    },
    _getCurrentPrice(symbolName) {
        return new Promise((resolve, reject) => {
            redis.client.get('symbol-' + symbolName, (err, symbol) => {
                if (err)
                    return reject(err);
                resolve(JSON.parse(symbol));
            });
        });
    }
};
//# sourceMappingURL=order.controller.js.map