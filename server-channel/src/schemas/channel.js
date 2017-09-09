"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const constants_1 = require("../../../shared/constants/constants");
exports.ChannelSchema = new mongoose_1.Schema({
    user_id: {
        type: String,
        lowercase: true,
        default: Date.now
    },
    name: {
        type: String,
        required: true
    },
    trades: {
        type: Number,
        default: 0
    },
    points: {
        type: Array,
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