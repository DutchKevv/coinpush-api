import {Schema, Types, model} from 'mongoose';
import {join} from 'path';
import * as beautifyUnique from 'mongoose-beautiful-unique-validation';
import {BROKER_GENERAL_TYPE_OANDA, LEVERAGE_TYPE_1} from '../../../shared/constants/constants';
import {IUser} from "../../../shared/interfaces/IUser.interface";

const config = require('../../../tradejs.config');

const UserSchema = new Schema({
	name: {
		type: String,
		unique: true,
		required: true,
		trim: true
    },
    img: {
        type: String
    }
});

UserSchema.plugin(beautifyUnique);

UserSchema.statics.normalizeProfileImg = function (doc) {
	const domainPrefix = 'http://' + (process.env.NODE_ENV === 'prod' ? config.ip.prod : config.ip.local) + ':' + config.port;

	// default img
	if (!doc.createUser.img) {
		doc.createUser.img = domainPrefix + config.image.profileDefaultUrl;
		return;
	}

	// external image
	if (doc.createUser.img.startsWith('/') || doc.createUser.img.startsWith('http://') || doc.createUser.img.startsWith('https://'))
		return;

	// user image
	doc.createUser.img = domainPrefix + join(config.image.profileBaseUrl, doc.createUser.img);
};

UserSchema.statics.addDevice = async function(userId, device) {
    const prevUsers: any = await User.find({devices: {$elemMatch: {token: device.token}}}, {_id: 1}).lean();

    await Promise.all(prevUsers.map(user => {
        if (user._id !== userId)
            return UserSchema.statics.removeDevice(userId, device);
    }));

    if (!prevUsers.find(user => user._id.toString() === userId))
        return User.update({_id: userId}, {$addToSet: {devices : device}});
}

UserSchema.statics.removeDevice = async function(userId, device) {
    return User.update({}, {$pull: {devices : device}});
}

export const User = model('User', UserSchema);