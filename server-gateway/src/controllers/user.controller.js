"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request-promise");
const redis = require("../modules/redis");
const constants_1 = require("../../../shared/constants/constants");
const channel_controller_1 = require("./channel.controller");
const config = require('../../../tradejs.config');
exports.userController = {
    async find(reqUser, userId, params = {}) {
        const user = await Promise.all([
            request({ uri: 'http://localhost:3002/social/user/' + userId, qs: { type: params.type }, headers: { _id: reqUser.id }, json: true }),
            request({ uri: 'http://localhost:3007/channel', qs: { user: userId }, headers: { _id: reqUser.id }, json: true }),
        ]);
        console.log(user[0]);
        return Object.assign(user[0], user[1].user[0]);
    },
    async findMany(reqUserId, params) {
        return request({ uri: 'http://localhost:3002/social/users/', json: true });
    },
    async create(reqUser, params) {
        let user, channel;
        try {
            // create user
            user = await request({
                uri: 'http://localhost:3002/social/user/',
                method: 'POST',
                body: params,
                json: true
            });
            // create channel
            channel = await channel_controller_1.channelController.create(reqUser, {
                name: params.username,
                type: constants_1.CHANNEL_TYPE_MAIN
            });
            return user;
        }
        catch (error) {
            if (user && user._id)
                this.remove(reqUser, user._id);
            if (channel && channel._id)
                channel_controller_1.channelController.remove(reqUser, user._id);
            throw new Error(error);
        }
    },
    getOverviewList() {
    },
    update(userId, params) {
    },
    /*
        TODO: Not request main channel but let channel service find user main channel
     */
    async toggleFollow(followerId, toFollowId) {
        // Get user main channel
        const channel = await request({
            uri: config.server.channel.apiUrl + '/channel/',
            method: 'GET',
            headers: { '_id': followerId },
            qs: {
                user: toFollowId
            },
            json: true
        });
        // Subscribe to channel
        const result = await channel_controller_1.channelController.toggleFollow(followerId, channel.user[0]._id);
        return result;
    },
    /*
        TODO: Not request main channel but let channel service find user main channel
     */
    async toggleCopy(followerId, toFollowId) {
        // Get user main channel
        const channel = await request({
            uri: config.server.channel.apiUrl + '/channel/',
            method: 'GET',
            headers: { '_id': followerId },
            qs: {
                user: toFollowId
            },
            json: true
        });
        // Subscribe to channel
        const result = await channel_controller_1.channelController.toggleCopy(followerId, channel.user[0]._id);
        return result;
    },
    remove(reqUser, userId) {
    },
    getSelf(userId) {
        let REDIS_KEY = constants_1.REDIS_USER_PREFIX + userId;
        return new Promise((resolve, reject) => {
            redis.client.get(REDIS_KEY, (err, content) => {
                if (!err)
                    return resolve(JSON.parse(content));
                this.find(userId);
            });
        });
    }
};
//# sourceMappingURL=user.controller.js.map