import { Schema, Types, model } from 'mongoose';
import { isEmail } from 'validator';
import { join } from 'path';
import { BROKER_GENERAL_TYPE_OANDA, LEVERAGE_TYPE_1, CHANNEL_TYPE_MAIN } from '../../../shared/constants/constants';
import { IUser } from "../../../shared/interfaces/IUser.interface";
import * as beautifyUnique from 'mongoose-beautiful-unique-validation';

const config = require('../../../tradejs.config');

const UserSchema = new Schema({
    name: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    profileImg: {
        type: String,
        trim: true
    }
});

/**
 * plugins
 */ 
UserSchema.plugin(beautifyUnique);

/**
 * helpers
 */
UserSchema.statics.normalizeProfileImg = function (doc) {

    // default img
    if (!doc.profileImg) {
        if (doc.type === CHANNEL_TYPE_MAIN)
            doc.profileImg = config.image.profileDefaultUrl;
        else
            doc.profileImg = config.image.channelDefaultUrl;

        return this;
    }

    // external image
    if (doc.profileImg.startsWith('/') || doc.profileImg.indexOf('http://') > -1 || doc.profileImg.indexOf('https://') > -1)
        return;

    // user image
    if (doc.type === CHANNEL_TYPE_MAIN)
        doc.profileImg = join(config.image.profileBaseUrl, doc.profileImg);

    // channel image
    else
        doc.profileImg = join(config.image.channelBaseUrl, doc.profileImg);
};

export const User = model('User', UserSchema);