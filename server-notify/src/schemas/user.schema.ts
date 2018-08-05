import { Schema, Types, model } from 'mongoose';
import { isEmail } from 'validator';
import { join } from 'path';
import * as beautifyUnique from 'mongoose-beautiful-unique-validation';
import { BROKER_GENERAL_TYPE_OANDA, LEVERAGE_TYPE_1, G_ERROR_USER_NOT_FOUND } from 'coinpush/src/constant';
import { IUser } from "coinpush/src/interface/IUser.interface";

export const UserSchema = new Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        validate: [isEmail, 'invalid email'],
        lowercase: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    img: {
        type: String,
        trim: true
    },
    companyId: {
        type: String,
        unique: true,
        sparse: true
    },
    devices: [{
        token: {
            type: String,
            // unique: true
        },
        name: {
            type: String,
            trim: true
        },
        platformType: {
            type: String,
            required: true
        }
    }],
    unreadCount: {
        type: Number,
        default: 0
    },
    settings: {
        lowMargin: {
            type: Boolean,
            default: true
        },
        orderClosedByMarket: {
            type: Boolean,
            default: true
        },
        userFollowsMe: {
            type: Boolean,
            default: true
        },
        userCopiesMe: {
            type: Boolean,
            default: true
        },
        like: {
            type: Boolean,
            default: true
        },
        comment: {
            type: Boolean,
            default: true
        },
        summary: {
            type: Number,
            default: 1
        }
    },
    removed: {
        type: Boolean
    }
}, {
	timestamps: true
});

UserSchema.statics.addDevice = async function (userId, device): Promise<void> {
    const prevUsers: any = await User.find({ devices: { $elemMatch: { token: device.token } } }, { _id: 1, devices: 1 });
    console.log('device devi', device.token, userId);
    // remove previous owners of token
    // TODO: really needed?
    // await Promise.all(prevUsers.map(user => {
    //     if (user._id !== userId)
    //         return UserSchema.statics.removeDevice(userId, device);
    // }));

    if (prevUsers.length) {
        await Promise.all(prevUsers.map(user => {
            user.devices = user.devices.filter(_device => _device.token !== device.token);
            return user.save();
        }));
    }
    // const present = await User.find({'de'})

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $addToSet: {
                devices: {
                    platformType: device.platformType,
                    token: device.token
                }
            }
        }
    );

    if (!user)
        throw ({ code: G_ERROR_USER_NOT_FOUND });
}

UserSchema.statics.removeDevice = async function (userId, token) {
    console.log('sdfsdf', userId, token);
    if (token) {
        // return User.update({_id: userId}, { $pull: { token: token } });
    }
}

UserSchema.plugin(beautifyUnique);

export const User = model('User', UserSchema, 'users');