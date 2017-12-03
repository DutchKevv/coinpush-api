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
    const domainPrefix = 'http://' + (process.env.NODE_ENV === 'prod' ? config.ip.prod : config.ip.devLocal) + ':' + config.port;

    // default img
    if (!doc.profileImg) {
        if (doc.type === CHANNEL_TYPE_MAIN)
            doc.profileImg = domainPrefix + config.image.profileDefaultUrl;
        else
            doc.profileImg = domainPrefix + config.image.channelDefaultUrl;

        return this;
    }

    // external image
    if (doc.profileImg.startsWith('/') || doc.profileImg.indexOf('http://') > -1 || doc.profileImg.indexOf('https://') > -1)
        return;

    // user image
    if (doc.type === CHANNEL_TYPE_MAIN)
        doc.profileImg = domainPrefix + join(config.image.profileBaseUrl, doc.profileImg);

    // channel image
    else
        doc.profileImg = domainPrefix + join(config.image.channelBaseUrl, doc.profileImg);

        console.log(doc.profileImg);
};

export const User = model('User', UserSchema);