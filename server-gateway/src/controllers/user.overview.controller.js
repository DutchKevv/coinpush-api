"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const channel_controller_1 = require("./channel.controller");
const config = require('../../../tradejs.config');
exports.userOverviewController = {
    getOverview(reqUser, params) {
        return channel_controller_1.channelController.findMany(reqUser, params);
    }
};
//# sourceMappingURL=user.overview.controller.js.map