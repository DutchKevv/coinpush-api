"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Base_1 = require("../classes/Base");
class BaseModel extends Base_1.Base {
    async init() {
        await super.init();
    }
    toJson() {
        return JSON.stringify(this.options);
    }
    sync() {
    }
    onDestroy() {
    }
}
exports.BaseModel = BaseModel;
//# sourceMappingURL=BaseModel.js.map