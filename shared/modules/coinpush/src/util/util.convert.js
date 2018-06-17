"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constant/constants");
const genderObj = {
    'male': constants_1.USER_GENDER_MALE,
    'female': constants_1.USER_GENDER_FEMALE,
    'other': constants_1.USER_GENDER_OTHER,
};
function genderStringToConstant(genderString) {
    if (typeof genderString !== 'string' || !genderString.length)
        return constants_1.USER_GENDER_UNKNOWN;
    return genderObj[genderString.toLowerCase()] || constants_1.USER_GENDER_UNKNOWN;
}
exports.genderStringToConstant = genderStringToConstant;
//# sourceMappingURL=util.convert.js.map