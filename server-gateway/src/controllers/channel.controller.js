"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request-promise");
const config = require('../../../tradejs.config');
exports.channelController = {
    async find(reqUser, params) {
        return Promise.resolve([]);
    },
    async findMany(reqUser, params) {
        return await request({
            uri: config.server.channel.apiUrl + '/channel',
            headers: { '_id': reqUser.id },
            json: true
        });
    },
    create(reqUser, params) {
        return request({
            uri: config.server.channel.apiUrl + '/channel/',
            method: 'POST',
            headers: {
                '_id': reqUser.id
            },
            body: {
                name: params.name,
                type: params.type
            },
            json: true
        });
    },
    update(userId, params) {
    },
    async toggleFollow(followerId, channelId) {
        // Subscribe to channel
        const result = await request({
            uri: config.server.channel.apiUrl + '/channel/' + channelId + '/follow',
            method: 'POST',
            headers: {
                '_id': followerId
            },
            json: true
        });
        return result;
    },
    async toggleCopy(followerId, channelId) {
        // Subscribe to channel
        const result = await request({
            uri: config.server.channel.apiUrl + '/channel/' + channelId + '/copy',
            method: 'POST',
            headers: {
                '_id': followerId
            },
            json: true
        });
        return result;
    },
    remove(reqUser, channelId) {
    }
};
//# sourceMappingURL=channel.controller.js.map