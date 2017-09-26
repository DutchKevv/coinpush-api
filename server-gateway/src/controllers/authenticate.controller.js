"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request-promise");
const config = require('../../../tradejs.config');
exports.authenticateController = {
    async login(email, password, token) {
        return request({
            uri: config.server.user.apiUrl + '/authenticate',
            method: 'POST',
            body: { email, password },
            json: true
        });
    }
};
//# sourceMappingURL=authenticate.controller.js.map