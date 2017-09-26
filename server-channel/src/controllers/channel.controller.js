"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("../modules/redis");
const channel_1 = require("../schemas/channel");
const mongoose_1 = require("mongoose");
const constants_1 = require("../../../shared/constants/constants");
const config = require('../../../tradejs.config');
redis_1.client.subscribe('user-created');
redis_1.client.on('message', async (channel, message) => {
    console.log(channel + ': ' + message);
    try {
        const data = JSON.parse(message);
        switch (channel) {
            case 'user-created':
                await exports.channelController.create(data._id, { name: 'main' });
                break;
        }
    }
    catch (error) {
        console.error(error);
    }
});
exports.channelController = {
    async findById(reqUser, id) {
        const channel = await channel_1.Channel.findById(id).lean();
        channel_1.Channel.normalize(reqUser, channel);
        return channel;
    },
    async findByUserId(reqUser, userId, type, fields) {
        const opt = { user_id: userId };
        if (typeof type === 'number')
            opt['type'] = type;
        let channels = await channel_1.Channel.find(opt, fields).lean();
        channels = channels.map(channel => channel_1.Channel.normalize(reqUser, channel));
        return channels;
    },
    async findMany(reqUser, params = {}) {
        const results = await channel_1.Channel.aggregate([
            {
                $project: {
                    followersCount: { $size: '$followers' },
                    copiersCount: { $size: '$copiers' },
                    followers: 1,
                    copiers: 1,
                    user_id: 1,
                    profileImg: 1,
                    name: 1,
                    transactions: 1,
                    description: 1
                }
            },
            {
                $limit: params.limit || 20
            },
            {
                $sort: {
                    _id: params.sort || -1
                }
            }
        ]);
        const channels = results.map(channel => {
            // TODO: MOVE EMPTY PROFILEIMG URL REDIRECT TO GATEWAY API
            channel_1.Channel.normalize(reqUser, channel);
            return channel;
        });
        return channels;
    },
    create(reqUser, options, type = constants_1.CHANNEL_TYPE_CUSTOM) {
        console.log('REU SUSDF USER US UER', options);
        return channel_1.Channel.create({
            user_id: reqUser.id,
            name: options.name,
            description: options.description,
            public: options.public,
            profileImg: options.profileImg,
            type
        });
    },
    update(reqUser, channelId, params) {
        return channel_1.Channel.update({ _id: mongoose_1.Types.ObjectId(channelId), type: constants_1.CHANNEL_TYPE_MAIN }, params);
    },
    updateByUserId(reqUser, userId, params) {
        console.log('USER USR UER SUDF SDFSDF', userId, params);
        return channel_1.Channel.update({ user_id: userId, type: constants_1.CHANNEL_TYPE_MAIN }, params);
    },
    async toggleFollow(reqUser, channelId, state) {
        console.log(reqUser.id, channelId, state);
        const channel = await channel_1.Channel.findById(channelId);
        // Validity checks
        if (!channel)
            throw new Error('Channel not found');
        if (channel.user_id.toString() === reqUser.id)
            throw new Error('Cannot follow self managed channels');
        const isFollowing = channel.followers && channel.followers.indexOf(reqUser.id) > -1;
        if (isFollowing)
            await channel.update({ $pull: { followers: reqUser.id } });
        else
            await channel.update({ $addToSet: { followers: reqUser.id } });
        return { state: !isFollowing };
    },
    async toggleCopy(reqUser, channelId, state) {
        console.log(reqUser.id, channelId, state);
        const channel = await channel_1.Channel.findById(channelId);
        // Validity checks
        if (!channel)
            throw new Error('Channel not found');
        if (channel.user_id.toString() === reqUser.id)
            throw new Error('Cannot copy self managed channels');
        const isCopying = channel.copiers && channel.copiers.indexOf(reqUser.id) > -1;
        console.log('isCopying isCopying isCopying isCopying', isCopying, channel);
        if (isCopying)
            await channel.update({ $pull: { copiers: mongoose_1.Types.ObjectId(reqUser.id) } });
        else
            await channel.update({ $addToSet: { copiers: mongoose_1.Types.ObjectId(reqUser.id) } });
        return { state: !isCopying };
    },
    delete(userId, id) {
        return channel_1.Channel.deleteOne({ _id: mongoose_1.Types.ObjectId(id), user_id: mongoose_1.Types.ObjectId(userId) });
    }
};
//# sourceMappingURL=channel.controller.js.map