import { Schema, model } from 'mongoose';
import * as beautifyUnique from 'mongoose-beautiful-unique-validation';

export const NotificationSchema = new Schema({
    toUserId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    fromUserId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    type: {
        type: String,
        required: true
    },
    data: [
        Schema.Types.Mixed
    ],
    createDate: {
        type: Date,
        default: Date.now
    },
    sendDate: {
        type: Date
    },
    readDate: {
        type: Date
    }
});

NotificationSchema.plugin(beautifyUnique);

export const Notification = model('Notification', NotificationSchema, 'notifications');