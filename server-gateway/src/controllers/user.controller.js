"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request-promise");
const redis = require("../modules/redis");
const constants_1 = require("../../../shared/constants/constants");
const channel_controller_1 = require("./channel.controller");
const config = require('../../../tradejs.config');
exports.userController = {
    async find(reqUser, userId, params = {}) {
        const results = await Promise.all([
            request({ uri: config.server.user.apiUrl + '/user/' + userId, qs: { type: params.type }, headers: { _id: reqUser.id }, json: true }),
            request({ uri: config.server.channel.apiUrl + '/channel/', qs: { user: userId }, headers: { _id: reqUser.id }, json: true }),
        ]);
        console.log(results[0], results[1].user[0]);
        return Object.assign({}, results[0] || {}, results[1].user[0] || {});
    },
    async findMany(reqUserId, params) {
        return request({ uri: config.server.user.apiUrl + '/user/' + reqUserId, json: true });
    },
    async create(reqUser, params) {
        let user, channel;
        try {
            // create user
            user = await request({
                uri: config.server.user.apiUrl + '/user',
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
    getOverviewList() {
    },
    async update(reqUser, params) {
        // create user
        return request({
            uri: config.server.user.apiUrl + '/user/' + reqUser.id,
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