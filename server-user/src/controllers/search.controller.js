"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("../schemas/user");
exports.searchController = {
    search(text, limit = 5) {
        const regex = new RegExp('.*' + text + '.*', 'i');
        return user_1.User.find({ username: regex }, { _id: 1, username: 1, profileImg: 1, counter: 1, followersCount: 1 }).limit(limit);
    }
};
//# sourceMappingURL=search.controller.js.map