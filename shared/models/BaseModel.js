"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Base_1 = require("../classes/Base");
class BaseModel extends Base_1.Base {
    init() {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            yield _super("init").call(this);
        });
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
