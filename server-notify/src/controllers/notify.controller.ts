import * as nodeMailer from 'nodemailer';
import { userController } from './user.controller';
import { IUser } from '../../../shared/interfaces/IUser.interface';
import * as gcm from 'node-gcm';
import { User } from '../schemas/user.schema';
import { Notification } from '../schemas/notification.schema';
import { IReqUser } from '../../../shared/interfaces/IReqUser.interface';

const config = require('../../../tradejs.config');

const sender = new gcm.Sender(config.firebase.key);

export const notifyController = {

    async findById(reqUser: IReqUser, id: string): Promise<any> {

    },

    async findMany(reqUser: IReqUser, params): Promise<any> {
        const limit = parseInt(params.limit, 10) || 20;
        const sort = params.sort || -1;

        const notifications = await Notification.find({}, {}).sort({ _id: sort }).limit(limit).lean();

        // notifications.forEach((user) => {
        // 	(<any>User).normalize(reqUser, user);
        // 	delete user['followers'];
        // });

        return notifications;
    },

    async sendToUser(userId, title, body, data: any = {}, params?: any) {
        data.__userId = userId;

        const user: any = await userController.findById({ id: userId }, userId);

        if (!user) {
            throw new Error('Could not find user');
        }
           
        const tokens = (user.devices || []).map(device => device.token);

        var message = new gcm.Message({
            priority: 'high',
            data: data,
            userId: userId,
            notification: {
                title,
                body,
                sound: "default"
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

    async sendTypePostComment(notification) {
        const fromUser: any = await User.findById(notification.fromUserId, { name: 1 });

        const title = `${fromUser.name} responded on your post`;
        const body = notification.data.content;
        const data = {
            type: 'post-comment',
            commentId: notification.data.commentId,
            parentId: notification.data.parentId
        }

        return this.sendToUser(notification.toUserId, title, body, data);
    },

    async sendTypePostLike(notification) {
        const fromUser: any = await User.findById(notification.fromUserId, { name: 1 });

        if (!fromUser)
            throw new Error('could not find user');

        const title = `${fromUser.name} liked your post`;
        const data = {
            type: 'post-like',
            commentId: notification.data.commentId,
        }

        return this.sendToUser(notification.toUserId, title, '', data);
    },

    async sendTypeCommentLike(notification) {
        const fromUser: any = await User.findById(notification.fromUserId, { name: 1 });

        const title = `${fromUser.name} liked your comment`;
        const data = {
            type: 'comment-like',
            commentId: notification.data.commentId,
            parentId: notification.data.parentId
        }

        return this.sendToUser(notification.toUserId, title, '', data);
    },

    async sendTypeSymbolAlarm(notification) {
        const title = `Price alarm triggered on ${notification.data.symbol} - ${notification.data.target}`;
        const data = {
            type: 'symbol-alarm',
            symbol: notification.data.symbol,
            target: notification.data.target,
            time: notification.data.time
        };

        return this.sendToUser(notification.toUserId, title, '', data);
    },

    async sendUserFollow(notification) {
        const fromUser: any = await User.findById(notification.fromUserId, { name: 1 });

        const title = `${fromUser.name} started following you!`;

        const data = {
            type: 'symbol-alarm'
        };

        return this.sendToUser(notification.toUserId, title, '', data);
    },

    async parse(notification) {
        console.log(notification);
        await this._store(notification);

        switch (notification.type) {
            case 'post-comment':
                return this.sendTypePostComment(notification);
            case 'post-like':
                return this.sendTypePostLike(notification);
            case 'comment-like':
                return this.sendTypeCommentLike(notification);
            case 'symbol-alarm':
                return this.sendTypeSymbolAlarm(notification);
            case 'user-follow':
                return this.sendUserFollow(notification);

        }
    },

    async _store(notification): Promise<any> {
        const createResult = await Notification.create(notification);
    }
};