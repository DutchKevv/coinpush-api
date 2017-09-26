"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const user_1 = require("../schemas/user");
exports.walletController = {
    async updateBalance(reqUser, walletId, params) {
        const user = await user_1.User.findByIdAndUpdate(mongoose_1.Types.ObjectId(reqUser.id), { $inc: { balance: params.amount } });
        if (user)
            return { balance: user.balance };
        throw `User ${reqUser.id} not found`;
    }
};
//# sourceMappingURL=wallet.controller.js.map