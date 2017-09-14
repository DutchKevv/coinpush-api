"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const constants_1 = require("../../../shared/constants/constants");
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
        type: String
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
exports.Channel = mongoose_1.model('Channel', exports.ChannelSchema);
//# sourceMappingURL=channel.js.map