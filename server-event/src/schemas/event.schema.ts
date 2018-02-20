import { Schema, Types, model } from 'mongoose';
import { isEmail } from 'validator';
import { join } from 'path';
import * as beautifyUnique from 'mongoose-beautiful-unique-validation';
import { BROKER_GENERAL_TYPE_OANDA, LEVERAGE_TYPE_1, CUSTOM_EVENT_TYPE_ALARM_NEW, CUSTOM_EVENT_TYPE_ALARM, CUSTOM_EVENT_TYPE_PRICE } from 'coinpush/constant/constants';
import { IUser } from "coinpush/interface/IUser.interface";

const EventSchema = new Schema(
    {
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
            required: true,
            enum: [CUSTOM_EVENT_TYPE_ALARM, CUSTOM_EVENT_TYPE_ALARM_NEW, CUSTOM_EVENT_TYPE_PRICE]
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
        }
    },
    {
        timestamps: true
    }
);

EventSchema.plugin(beautifyUnique);

export const Event = model('Event', EventSchema);