"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request-promise");
const constants_1 = require("../../../shared/constants/constants");
const config = require('../../../tradejs.config');
exports.orderController = {
    find(params) {
        return Promise.resolve([]);
    },
    async create(reqUser, params, triggerCopy = true) {
        const order = await request({
            uri: config.server.order.apiUrl + '/order',
            method: 'POST',
            headers: { '_id': reqUser.id },
            body: params,
            json: true
        });
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
    }
};
//# sourceMappingURL=order.controller.js.map