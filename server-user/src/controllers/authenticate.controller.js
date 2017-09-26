"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("../schemas/user");
exports.authenticateController = {
    login(email, password, token) {
        if (!email || !password)
            return false;
        return user_1.User.authenticate(email, password, token);
    }
};
//# sourceMappingURL=authenticate.controller.js.map