import {Schema, Types, model} from 'mongoose';
import {join} from 'path';
import * as beautifyUnique from 'mongoose-beautiful-unique-validation';
import {BROKER_GENERAL_TYPE_OANDA, LEVERAGE_TYPE_1} from 'coinpush/constant';
import {IUser} from "coinpush/interface/IUser.interface";

const config = require('../../../tradejs.config');

const UserSchema = new Schema({
	name: {
		type: String,
		required: true,
		trim: true
    },
    img: {
        type: String
    }
}, {
	timestamps: true
});

UserSchema.plugin(beautifyUnique);

UserSchema.statics.normalizeProfileImg = function (doc) {
	// default img
	if (!doc.createUser.img) {
		doc.createUser.img = config.image.profileDefaultUrl;
		return;
	}

	// external image
	if (doc.createUser.img.startsWith('/') || doc.createUser.img.startsWith('http://') || doc.createUser.img.startsWith('https://'))
		return;

	// user image
	doc.createUser.img = join(config.image.profileBaseUrl, doc.createUser.img);
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