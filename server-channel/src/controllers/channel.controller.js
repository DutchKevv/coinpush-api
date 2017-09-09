"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("../modules/redis");
const channel_1 = require("../schemas/channel");
const constants_1 = require("../../../shared/constants/constants");
const config = require('../../../tradejs.config');
redis_1.client.subscribe('user-created');
redis_1.client.on('message', (channel, message) => {
    const json = JSON.parse(message);
    if (channel === 'user-created') {
        exports.channelController.create({
            user_id: json._id
        });
    }
    console.log('Message ' + message + ' on channel ' + channel + ' arrived!');
});
exports.channelController = {
    async find(params) {
    },
    async findByUserId(id) {
        return channel_1.Channel.findOne({ user_id: id, type: constants_1.CHANNEL_TYPE_MAIN });
    },
    create(params) {
        return channel_1.Channel.create(params);
    }
};
//# sourceMappingURL=channel.controller.js.map