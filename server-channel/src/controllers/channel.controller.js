"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("../modules/redis");
const channel_1 = require("../schemas/channel");
const mongoose_1 = require("mongoose");
const constants_1 = require("../../../shared/constants/constants");
const config = require('../../../tradejs.config');
redis_1.client.subscribe('user-created');
redis_1.client.subscribe('order-created');
redis_1.client.on('message', async (channel, message) => {
    console.log(channel + ': ' + message);
    try {
        const data = JSON.parse(message);
        switch (channel) {
            case 'user-created':
                await exports.channelController.create(data._id, { name: 'main' });
                break;
            case 'order-created':
                await exports.channelController.copyOrder(data);
                break;
        }
    }
    catch (error) {
        console.error(error);
    }
});
exports.channelController = {
    async findById(id) {
        return channel_1.Channel.findById(id);
    },
    async findByUserId(id, type, fields) {
        const opt = { user_id: id };
        if (typeof type === 'number')
            opt['type'] = type;
        return await channel_1.Channel.find(opt, fields);
    },
    create(userId, options, type = constants_1.CHANNEL_TYPE_CUSTOM) {
        return channel_1.Channel.create({
            user_id: userId,
            name: options.name,
            description: options.description,
            public: options.public,
            type
        });
    },
    update(userId, id, options) {
        return Promise.reject('TODO');
    },
    async toggleFollow(followerId, channelId, state) {
        console.log(followerId, channelId, state);
        const channel = await this.findById(channelId);
        // Validity checks
        if (!channel)
            throw new Error('Channel not found');
        console.log(channel.user_id);
        if (channel.user_id === followerId)
            throw new Error('Cannot follow self managed channels');
        const isFollowing = channel.followers.indexOf(followerId) > -1;
        if (isFollowing) {
            await channel_1.Channel.update({ _id: channelId }, { $pull: { followers: mongoose_1.Types.ObjectId(followerId) } });
        }
        else {
            await channel_1.Channel.update({ _id: channelId }, { $addToSet: { followers: mongoose_1.Types.ObjectId(followerId) } });
        }
        return { state: !isFollowing };
    },
    async toggleCopy(copierId, channelId, state) {
        console.log(copierId, channelId, state);
        const channel = await this.findById(channelId);
        // Validity checks
        if (!channel)
            throw new Error('Channel not found');
        console.log(channel.user_id);
        if (channel.user_id === copierId)
            throw new Error('Cannot copy self managed channels');
        const isCopying = !!(channel && channel.copiers && channel.copiers.indexOf(copierId) > -1);
        if (isCopying) {
            await channel_1.Channel.update({ _id: channelId }, { $pull: { copiers: mongoose_1.Types.ObjectId(copierId) } });
        }
        else {
            await channel_1.Channel.update({ _id: channelId }, { $addToSet: { copiers: mongoose_1.Types.ObjectId(copierId) } });
        }
        return { state: !isCopying };
    },
    async toggleCopyByUserId(followerId, userId, state) {
        const channel = await this.findByUserId(userId, constants_1.CHANNEL_TYPE_MAIN, { _id: 1 })[0];
        if (channel)
            return this.toggleCopyByChannelId(followerId, channel._id, state);
        else
            throw new Error('Channel not found');
    },
    async copyOrder(order) {
        console.log('ORDER ORDER ORDER', order);
        const channels = await this.findByUserId(order.user, constants_1.CHANNEL_TYPE_MAIN);
        console.log('CHANNEL!', channels);
        if (!channels.length)
            throw new Error('Copy Order - Channel could not be found!');
        channels.forEach(channel => {
            channel.followers.forEach(userId => {
                console.log('follower user id: ', userId);
            });
        });
    },
    delete(userId, id) {
        return channel_1.Channel.deleteOne({ _id: mongoose_1.Types.ObjectId(id), user_id: mongoose_1.Types.ObjectId(userId) });
    }
};
//# sourceMappingURL=channel.controller.js.map