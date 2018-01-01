import { Schema, Types, model } from 'mongoose';
import { isEmail } from 'validator';
import { join } from 'path';
import * as beautifyUnique from 'mongoose-beautiful-unique-validation';
import { BROKER_GENERAL_TYPE_OANDA, LEVERAGE_TYPE_1, G_ERROR_USER_NOT_FOUND } from '../../../shared/constants/constants';
import { IUser } from "../../../shared/interfaces/IUser.interface";

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
        unique: true,
        required: true,
        trim: true
    },
    devices: [{
        token: {
            type: String,
            required: true
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
    }
});

UserSchema.statics.addDevice = async function (userId, device): Promise<void> {
    const prevUsers: any = await User.find({ devices: { $elemMatch: { token: device.token } } }, { _id: 1 }).lean();

    // remove previous owners of token
    // TODO: really needed?
    await Promise.all(prevUsers.map(user => {
        if (user._id !== userId)
            return UserSchema.statics.removeDevice(userId, device);
    }));
    console.log('userId', userId);
    const user = await User.findByIdAndUpdate(
        Types.ObjectId(userId),
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

    console.log(await User.findById(userId));
}

UserSchema.statics.removeDevice = async function (userId, device) {
    return User.update({_id: userId}, { $pull: { devices: device } });
}

UserSchema.plugin(beautifyUnique);

export const User = model('User', UserSchema, 'users');