"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("../schemas/user");
exports.searchController = {
    search(text) {
        const regex = new RegExp('.*' + text + '.*', 'i');
        return user_1.User.find({ username: regex }, { _id: 1, username: 1, profileImg: 1, counter: 1, followersCount: 1 });
    }
};
//# sourceMappingURL=followers.controller.js.map