import {Schema, model} from 'mongoose';
import * as beautifyUnique from 'mongoose-beautiful-unique-validation';

const UserSchema = new Schema({
	name: {
		type: String,
		required: true,
		trim: true
    },
    img: {
        type: String
    },
    companyId: {
        type: String,
        unique: true,
        sparse: true
    },
	removed: {
		type: Boolean
	}
}, {
	timestamps: true
});

UserSchema.plugin(beautifyUnique);

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