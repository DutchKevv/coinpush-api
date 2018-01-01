import * as nodeMailer from 'nodemailer';
import { userController } from './user.controller';
import { IUser } from '../../../shared/interfaces/IUser.interface';
import * as gcm from 'node-gcm';
import { User } from '../schemas/user.schema';

const config = require('../../../tradejs.config');

const sender = new gcm.Sender(config.firebase.key);

export const notifyController = {

    async sendToUser(userId, params) {

        const user: any = await userController.findById({ id: userId }, userId);

        if (!user)
            throw new Error('Could not find user');

        const tokens = (user.devices || []).map(device => device.token);

        var message = new gcm.Message({
            priority: 'high',
            data: {
                body: params.body,
                contentAvailable: true,
            },
            notification: {
                title: params.title,
                body: ''
            }
        });

        // Actually send the message
        sender.send(message, { registrationTokens: tokens }, function (err, response) {
            if (err)
                return !console.log('ERROR') && console.error(err);
            else
                console.log('response', response);
        });
    },

    async sendTypePostComment(toUserId, data) {
        const fromUser: any = await User.findById(data.fromUserId, { name: 1 });

        return notifyController.sendToUser(data.toUserId, {
            title: `${fromUser.name} responded on your post`,
            label: 'blaldksldksd',
            body: {
                type: 'post-comment',
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

    async sendTypeSymbolAlarm(toUserId, data) {
        return notifyController.sendToUser(data.toUserId, {
            title: `${data.symbolDisplayName} hit ${data.target}`,
            label: 'blaldksldksd',
            body: {
                type: 'symbol-alarm',
                symbol: data.symbol,
                target: data.target,
                time: data.time
            }
        });
    },

    parseByType(type, data) {
        switch (type) {
            case 'post-comment':
                return this.sendTypePostComment(data.toUserId, data);
            case 'post-like':
                return this.sendTypePostLike(data.toUserId, data);
            case 'comment-like':
                return this.sendTypeCommentLike(data.toUserId, data);
            case 'symbol-alarm':
                return this.sendTypeSymbolAlarm(data.toUserId, data);

        }
        console.log('nnnnnnn', type, data);
    }
};