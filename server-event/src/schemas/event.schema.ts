import {Schema, Types, model} from 'mongoose';
import {isEmail} from 'validator';
import {join} from 'path';
import * as beautifyUnique from 'mongoose-beautiful-unique-validation';
import {BROKER_GENERAL_TYPE_OANDA, LEVERAGE_TYPE_1} from '../../../shared/constants/constants';
import {IUser} from "../../../shared/interfaces/IUser.interface";

const EventSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		required: true
    },
    symbol: {
        type: String,
        required: true,
        uppercase: true
    },
    name: {
        type: String
    },
	type: {
        type: Number,
        required: true
    },
    alarm: {
        price: {
            type: Number
        },
        perc: {
            type: Number
        },
        dir: {
            type: Number
        }
    },
    triggered: {
        type: Boolean,
        default: false
    },
    triggeredDate: {
        type: Date
    },
    createDate: {
        type: Date,
        default: Date.now
    }
});

EventSchema.plugin(beautifyUnique);

export const Event = model('Event', EventSchema);