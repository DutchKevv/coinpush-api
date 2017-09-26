"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseModel_1 = require("../models/BaseModel");
class OrderModel extends BaseModel_1.BaseModel {
}
OrderModel.DEFAULTS = {
    user: null,
    channel: null,
    type: null,
    amount: 0,
    symbol: null,
    stopLoss: 0,
    balance: 0,
    takeProfit: 0,
    magic: 0,
    profit: 0,
    profitPerc: 0
};
exports.OrderModel = OrderModel;

//# sourceMappingURL=OrderModel.js.map
