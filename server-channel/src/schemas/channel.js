"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const path_1 = require("path");
const constants_1 = require("../../../shared/constants/constants");
const config = require('../../../tradejs.config');
exports.ChannelSchema = new mongoose_1.Schema({
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    profileImg: {
        type: String,
        default: ''
    },
    description: {
        type: String
    },
    transactions: {
        type: Number,
        default: 0
    },
    orders: {
        type: [mongoose_1.Schema.Types.ObjectId],
        default: []
    },
    points: {
        type: Array,
        default: []
    },
    pips: {
        type: Number,
        default: 0
    },
    followers: {
        type: [mongoose_1.Schema.Types.ObjectId],
        default: []
    },
    copiers: {
        type: [mongoose_1.Schema.Types.ObjectId],
        default: []
    },
    public: {
        type: Boolean,
        default: true
    },
    type: {
        type: Number,
        default: constants_1.CHANNEL_TYPE_MAIN
    }
});
exports.ChannelSchema.statics.normalize = function (user, doc) {
    if (!doc)
        return;
    exports.Channel.normalizeProfileImg(doc);
    exports.Channel.setICopy(user, doc);
    exports.Channel.setIFollow(user, doc);
    return doc;
};
exports.ChannelSchema.statics.setICopy = function (user, doc) {
    doc.iFollow = doc.followers.map(f => f.toString()).indexOf(user.id) > -1;
    return this;
};
exports.ChannelSchema.statics.setIFollow = function (user, doc) {
    doc.iCopy = doc.copiers.map(c => c.toString()).indexOf(user.id) > -1;
    return this;
};
/**
 * Transform image filename to full url
 * @param filename
 * @returns {any}
 */
exports.ChannelSchema.statics.normalizeProfileImg = function (doc) {
    if (doc.profileImg) {
        if (doc.profileImg.indexOf('http://') > -1 || doc.profileImg.indexOf('https://') > -1)
            return;
        if (doc.type === constants_1.CHANNEL_TYPE_MAIN)
            doc.profileImg = path_1.join(config.image.profileBaseUrl, doc.profileImg);
        else
            doc.profileImg = path_1.join(config.image.channelBaseUrl, doc.profileImg);
    }
    else {
        if (doc.type === constants_1.CHANNEL_TYPE_MAIN)
            doc.profileImg = config.image.profileDefaultUrl;
        else
            doc.profileImg = config.image.channelDefaultUrl;
    }
    return this;
};
exports.Channel = mongoose_1.model('Channel', exports.ChannelSchema);
//# sourceMappingURL=channel.js.map