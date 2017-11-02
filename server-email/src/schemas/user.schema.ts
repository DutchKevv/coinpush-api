import {Schema, Types, model} from 'mongoose';
import {isEmail} from 'validator';
import {join} from 'path';
import * as beautifyUnique from 'mongoose-beautiful-unique-validation';
import {BROKER_GENERAL_TYPE_OANDA, LEVERAGE_TYPE_1} from '../../../shared/constants/constants';
import {IUser} from "../../../shared/interfaces/IUser.interface";

const UserSchema = new Schema({
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

UserSchema.plugin(beautifyUnique);

export const User = model('User', UserSchema);