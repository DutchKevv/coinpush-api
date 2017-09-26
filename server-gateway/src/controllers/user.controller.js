"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request-promise");
const constants_1 = require("../../../shared/constants/constants");
const channel_controller_1 = require("./channel.controller");
const config = require('../../../tradejs.config');
exports.userController = {
    async find(reqUser, userId, params = {}) {
        const results = await Promise.all([
            this._getUser(reqUser, userId, params.type),
            channel_controller_1.channelController.findByUserId(reqUser, userId),
        ]);
        return Object.assign({}, results[0] || {}, results[1].user[0] || {});
    },
    async findMany(reqUserId, params) {
        return request({ uri: config.server.user.apiUrl + '/user/' + reqUserId, json: true });
    },
    async getBalance(reqUser, userId) {
        const user = await this._getUser(reqUser, userId, constants_1.USER_FETCH_TYPE_ACCOUNT_DETAILS);
        if (user) {
            return user.balance;
        }
    },
    async create(reqUser, params) {
        let user, channel;
        try {
            // create user
            user = await request({
                uri: config.server.user.apiUrl + '/user',
                headers: { '_id': reqUser.id },
                method: 'POST',
                body: params,
                json: true
            });
            // create channel
            channel = await channel_controller_1.channelController.create({ id: user._id }, {
                name: params.username,
                type: constants_1.CHANNEL_TYPE_MAIN,
                profileImg: params.profileImg
            });
            return { user, channel };
        }
        catch (error) {
            if (user && user._id)
                this.remove(reqUser, user._id);
            if (channel && channel._id)
                channel_controller_1.channelController.remove(reqUser, channel._id);
            console.error(error);
            throw new Error(error);
        }
    },
    update(reqUser, params) {
        return request({
            uri: config.server.user.apiUrl + '/user/' + reqUser.id,
            headers: { '_id': reqUser.id },
            method: 'PUT',
            body: params,
            json: true
        });
    },
    updateBalance(reqUser, params) {
        return request({
            uri: config.server.user.apiUrl + '/wallet/' + reqUser.id,
            headers: { '_id': reqUser.id },
            method: 'PUT',
            body: params,
            json: true
        });
    },
    /*
        TODO: Not request main channel but let channel service find user main channel
     */
    async toggleFollow(reqUser, toFollowId) {
        // Get user main channel
        const channel = await request({
            uri: config.server.channel.apiUrl + '/channel/',
            method: 'GET',
            headers: { '_id': reqUser.id },
            qs: {
                user: toFollowId
            },
            json: true
        });
        // Subscribe to channel
        const result = await channel_controller_1.channelController.toggleFollow(reqUser.id, channel.user[0]._id);
        return result;
    },
    /*
        TODO: Not request main channel but let channel service find user main channel
     */
    async toggleCopy(reqUser, toFollowId) {
        // Get user main channel
        const channel = await request({
            uri: config.server.channel.apiUrl + '/channel/',
            method: 'GET',
            headers: { '_id': reqUser.id },
            qs: {
                user: toFollowId
            },
            json: true
        });
        // Subscribe to channel
        const result = await channel_controller_1.channelController.toggleCopy(reqUser.id, channel.user[0]._id);
        return result;
    },
    remove(reqUser, userId) {
    },
    _getUser(reqUser, userId, type) {
        return request({ uri: config.server.user.apiUrl + '/user/' + userId, qs: { type }, headers: { _id: reqUser.id }, json: true });
    }
};
//# sourceMappingURL=user.controller.js.map