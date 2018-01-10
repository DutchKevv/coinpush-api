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

    async findMany(reqUser: IReqUser, params: any = {}): Promise<any> {
        const limit = parseInt(params.limit, 10) || 20;
        const sort = params.sort || -1;

        return Notification.find({ toUserId: reqUser.id }).sort({ _id: sort }).limit(limit).lean();
    },

    async sendToUser(userId, title, body, data: any = {}, user?: any) {
        data.__userId = userId;

        user = user || await User.findById(userId);
        if (!user)
            throw ({ code: 404 });

        const registrationTokens = (user.devices || []).map(device => device.token);

        const message = new gcm.Message({
            priority: 'high',
            data: {
                title,
                body,
                data
            }
        });

        // actually send the message
        const sendResult = await new Promise((resolve, reject) => {

            sender.send(message, { registrationTokens }, async (error, response) => {
                if (error)
                    return reject(error);

                // cleanup old tokens
                if (response.failure > 0) {
                    response.results.forEach((result, i) => {
                        if (result.error === 'NotRegistered')
                            user.devices.splice(user.devices.findIndex(device => device.token === registrationTokens[i]), 1);
                        else
                            console.log('Unhandled GCM error', result.error);
                    });
                }

                // save removed devices + send date
                user.sendDate = new Date
                await user.save();

                resolve(response);
            });
        });

        return sendResult;
    },

    async sendTypePostComment(notification, user) {
        const fromUser: any = await User.findById(notification.fromUserId, { name: 1 });

        const title = `${fromUser.name} responded on your post`;
        const body = notification.data.content;
        const data = {
            type: 'post-comment',
            commentId: notification.data.commentId,
            parentId: notification.data.parentId
        }

        return this.sendToUser(notification.toUserId, title, body, data, user);
    },

    async sendTypePostLike(notification, user) {
        const fromUser: any = await User.findById(notification.fromUserId, { name: 1 });

        if (!fromUser)
            throw new Error('could not find user');

        const title = `${fromUser.name} liked your post`;
        const data = {
            type: 'post-like',
            commentId: notification.data.commentId,
        }

        return this.sendToUser(notification.toUserId, title, '', data, user);
    },

    async sendTypeCommentLike(notification, user) {
        const fromUser: any = await User.findById(notification.fromUserId, { name: 1 });

        const title = `${fromUser.name} liked your comment`;
        const data = {
            type: 'comment-like',
            commentId: notification.data.commentId,
            parentId: notification.data.parentId
        }

        return this.sendToUser(notification.toUserId, title, '', data, user);
    },

    async sendTypeSymbolAlarm(notification, user) {
        const title = `Price alarm triggered on ${notification.data.symbol} - ${notification.data.target}`;
        const data = {
            type: 'symbol-alarm',
            symbol: notification.data.symbol,
            target: notification.data.target,
            time: notification.data.time
        };

        return this.sendToUser(notification.toUserId, title, '', data, user);
    },

    async sendUserFollow(notification, user) {
        const fromUser: any = await User.findById(notification.fromUserId, { name: 1 });

        const title = `${fromUser.name} started following you!`;

        const data = {
            type: 'symbol-alarm'
        };

        return this.sendToUser(notification.toUserId, title, '', data, user);
    },

    async parse(notification) {
        const document = await this.create(notification);
        const user = await User.findByIdAndUpdate(notification.toUserId, { $inc: { unreadCount: 1 } });

        switch (notification.type) {
            case 'post-comment':
                await this.sendTypePostComment(notification, user);
                break;
            case 'post-like':
                await this.sendTypePostLike(notification, user);
                break;
            case 'comment-like':
                await this.sendTypeCommentLike(notification, user);
                break;
            case 'symbol-alarm':
                await this.sendTypeSymbolAlarm(notification, user);
                break;
            case 'user-follow':
                await this.sendUserFollow(notification, user);
                break;
        }
    },

    async updateUnread(reqUser: IReqUser, notificationId: string) {
        const notification = <any>await Notification.findById(notificationId);

        if (!notification)
            throw ({ code: 404 });

        if (notification.toUserId !== reqUser.id)
            throw ({ code: 401 });

        if (notification.readDate)
            return;

        notification.readDate = Date.now;
        notification.isRead = true;

        await Promise.all([
            notification.save(),
            User.update({ _id: reqUser.id }, { $inc: { unreadCount: -1 } })
        ])
    },

    async updateAllUnread(reqUser: IReqUser) {
        const results = await Promise.all([
            Notification.update({ toUserId: reqUser.id}, { readDate: new Date, isRead: true }),
            this.resetUnreadCount(reqUser)
        ]);

        console.log(results);
    },

    async resetUnreadCount(reqUser: IReqUser) {
        const result = await User.update({ _id: reqUser.id }, { unreadCount: 0 });
    },

    async create(notification): Promise<any> {
        const document = new Notification(notification);
        await document.save();
        return document;
    }
};