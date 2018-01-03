import * as nodeMailer from 'nodemailer';
import { userController } from './user.controller';
import { IUser } from '../../../shared/interfaces/IUser.interface';
import * as gcm from 'node-gcm';
import { User } from '../schemas/user.schema';

const config = require('../../../tradejs.config');

const sender = new gcm.Sender(config.firebase.key);

export const notifyController = {

    async sendToUser(userId, title, body, data, params?: any) {

        const user: any = await userController.findById({ id: userId }, userId);

        if (!user)
            throw new Error('Could not find user');

        const tokens = (user.devices || []).map(device => device.token);

        var message = new gcm.Message({
            priority: 'high',
            data: data,
            notification: {
                title,
                body,
                sound: "default",
                userId
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

    async sendTypePostComment(toUserId, params) {
        const fromUser: any = await User.findById(params.fromUserId, { name: 1 });

        const title = `${fromUser.name} responded on your post`;
        const body = params.content;
        const data = {
            type: 'post-comment',
            commentId: params.commentId,
            parentId: params.parentId
        }

        return notifyController.sendToUser(params.toUserId, title, body, data);
    },

    async sendTypePostLike(toUserId, params) {
        const fromUser: any = await User.findById(params.fromUserId, { name: 1 });

        const title = `${fromUser.name} liked your post`;
        const data = {
            type: 'post-like',
            commentId: params.commentId,
        }

        return notifyController.sendToUser(params.toUserId, title, '', data);
    },

    async sendTypeCommentLike(toUserId, params) {
        const fromUser: any = await User.findById(params.fromUserId, { name: 1 });

        const title = `${fromUser.name} liked your comment`;
        const data = {
            type: 'comment-like',
            commentId: params.commentId,
            parentId: params.parentId
        }

        return notifyController.sendToUser(params.toUserId, title, '', data);
    },

    async sendTypeSymbolAlarm(toUserId, params) {
        const title = `Price alarm triggered on ${params.symbol} - ${params.target}`;
        const data = {
            type: 'symbol-alarm',
            symbol: params.symbol,
            target: params.target,
            time: params.time
        };

        return notifyController.sendToUser(params.toUserId, title, '', data);
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
    }
};