import * as nodeMailer from 'nodemailer';
import { userController } from './user.controller';
import { IUser } from '../../../shared/interfaces/IUser.interface';
import * as redis from '../modules/redis';
import * as gcm from 'node-gcm';
import { User } from '../schemas/user.schema';

const config = require('../../../tradejs.config');

// Set up the sender with your GCM/FCM API key (declare this once for multiple messages)
const sender = new gcm.Sender('AAAAcOdrZII:APA91bHdt3bPaqUW4sWF7tht0xJs13B_X-4Svm4TlWeLnXXFoVsPxWRQGxUPdqudCP1OHkQ-IJCVO10DJKi8G2fLekqfpy0xAXGakQmj-7FZW3DwB18BxcHNIWlgNC9T3T1tbXEnbaxM');

redis.client.subscribe("notify");

export const notifyController = {

    async sendToUser(userId, params) {

        const user: any = await userController.findById({ id: userId }, userId);

        console.log(user);

        const tokens = (user.devices || []).map(device => device.token);

        // Send a message to the devices corresponding to the provided
        // registration tokens.
        // Prepare a message to be sent
        var message = new gcm.Message();

        message.addNotification({
            title: params.title,
            body: params.body
        });

        // Actually send the message
        sender.send(message, { registrationTokens: tokens }, function (err, response) {
            if (err)
                return console.error(err);

            else console.log(response);
        });
    },

    async sendTypePostComment(toUserId, data) {
        const fromUser: any = await User.findById(data.fromUserId, {name: 1});

        return notifyController.sendToUser(data.toUserId, {
            title: `${fromUser.name} responded on your post`,
            label: 'blaldksldksd',
            body: {
                type: 'comment-reaction',
                commentId: data.commentId,
                parentId: data.parentId
            }
        });
    },

    async sendTypePostLike(toUserId, data) {
        const fromUser: any = await User.findById(data.fromUserId, { name: 1 });

        return notifyController.sendToUser(data.toUserId, {
            title: `${fromUser.name} liked your post`,
            label: 'blaldksldksd',
            body: {
                type: 'post-like',
                commentId: data.commentId,
            }
        });
    },

    async sendTypeCommentLike(toUserId, data) {
        const fromUser: any = await User.findById(data.fromUserId, { name: 1 });

        return notifyController.sendToUser(data.toUserId, {
            title: `${fromUser.name} liked your comment`,
            label: 'blaldksldksd',
            body: {
                type: 'comment-like',
                commentId: data.commentId,
                parentId: data.parentId
            }
        });
    },

    parseByType(type, data) {
        switch (type) {
            case 'comment-reaction':
                return this.sendTypePostComment(data.toUserId, data);
            case 'post-like':
                return this.sendTypePostLike(data.toUserId, data);
            case 'comment-like':
                return this.sendTypeCommentLike(data.toUserId, data);

        }
        console.log('nnnnnnn', type, data);
    }
};