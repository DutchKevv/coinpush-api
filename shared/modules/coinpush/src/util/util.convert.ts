import { USER_GENDER_UNKNOWN, USER_GENDER_MALE, USER_GENDER_FEMALE, USER_GENDER_OTHER } from "../constant/constants";

const genderObj = {
    'male': USER_GENDER_MALE,
    'female': USER_GENDER_FEMALE,
    'other': USER_GENDER_OTHER,
}

export function genderStringToConstant(genderString?: string): number {
    if (typeof genderString !== 'string' || !genderString.length)
        return USER_GENDER_UNKNOWN;

    return genderObj[genderString.toLowerCase()] || USER_GENDER_UNKNOWN;
}