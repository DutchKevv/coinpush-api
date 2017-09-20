"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request-promise");
const redis = require("../modules/redis");
const constants_1 = require("../../../shared/constants/constants");
const channel_controller_1 = require("./channel.controller");
const config = require('../../../tradejs.config');
exports.userController = {
    async find(reqUser, userId) {
        return Promise.resolve([]);
    },
    async findMany(reqUserId, params) {
        const results = await Promise.all([
            this.find(reqUserId),
            request({ uri: 'http://localhost:3002/social/users/', json: true })
        ]);
        console.log(results);
        return results[1];
    },
    async create(params) {
        try {
            // Create user
            const user = await request({
                uri: 'http://localhost:3002/social/user/',
                method: 'POST',
                body: params,
                json: true
            });
            console.log('user', user);
            // Create channel
            const channel = await request({
                uri: config.server.channel.apiUrl + '/channel',
                method: 'POST',
                headers: {
                    '_id': user._id
                },
                body: {
                    name: 'main',
                    type: constants_1.CHANNEL_TYPE_MAIN
                },
                json: true
            });
            console.log('channel', channel);
            // // Update user with main channel
            // const result = await request({
            // 	uri: 'http://localhost:3002/social/user/' + user._id + '/',
            // 	method: 'PUT',
            // 	headers: {
            // 		'_id': user._id
            // 	},
            // 	body: {
            // 		channels: [channel._id]
            // 	},
            // 	json: true
            // });
            //
            // console.log('RESULT RESULT RESULT!!', result);
            return user;
        }
        catch (error) {
            console.error(error);
            throw new Error('ERROR');
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
    remove() {
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