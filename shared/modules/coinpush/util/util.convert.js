"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constant_1 = require("../constant");
const genderObj = {
    'male': constant_1.USER_GENDER_MALE,
    'female': constant_1.USER_GENDER_FEMALE,
    'other': constant_1.USER_GENDER_OTHER,
};
function genderStringToConstant(genderString) {
    if (typeof genderString !== 'string' || !genderString.length)
        return constant_1.USER_GENDER_UNKNOWN;
    return genderObj[genderString.toLowerCase()] || constant_1.USER_GENDER_UNKNOWN;
}
exports.genderStringToConstant = genderStringToConstant;
