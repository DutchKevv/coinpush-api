import * as nodeMailer from 'nodemailer';
import { userController } from './user.controller';
import { IUser } from 'coinpush/src/interface/IUser.interface';
import * as FCM from 'fcm-node';
import { User } from '../schemas/user.schema';
import { Notification } from '../schemas/notification.schema';
import { INotification } from 'coinpush/src/interface/notification.interface';
import { IReqUser } from 'coinpush/src/interface/IReqUser.interface';
import { pubClient } from 'coinpush/src/redis';
import { config } from 'coinpush/src/util/util-config';

const fcm = new FCM(config.push.firebase.key)

export const notifyController = {

    async findById(reqUser: IReqUser, id: string): Promise<any> {

    },

    async findMany(reqUser: IReqUser, params: any = {}): Promise<any> {
        const limit = parseInt(params.limit, 10) || 20;
        const sort = params.sort || -1;

        return Notification
            .find({
                toUserId: reqUser.id
            })
            .populate('fromUserId', ['_id', 'name', 'img'])
            .sort({ _id: sort })
            .limit(limit)
            .lean();
    },

    async create(notification): Promise<any> {
        const doc = await Notification.create(notification);
        return doc;
    },

    /**
     * TODO: check if user has GCM enabled, otherwhise send through websocket
     * @param userId 
     * @param title 
     * @param body 
     * @param data 
     * @param user 
     */
    async sendToUser(notificationId, userId, title, body, data: any = {}, user?: any) {
        data.__userId = userId;

        user = user || await User.findById(userId);

        if (!user)
            throw ({ code: 404 });

        const GCMTokens = (user.devices || []).map(device => device.token).filter(token => !!token);

        const message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
            priority: 'high',
            registration_ids: GCMTokens,
            collapse_key: data.type,
            data: {
                title,
                body,
                ...data
            }
        }

        // actually send the message
        const sendResult = await new Promise((resolve, reject) => {

            fcm.send(message, async (error, response) => {
                if (error) {
                    return reject(error);
                } else {
                    // cleanup old tokens
                    if (response.failure > 0) {
                        response.results.forEach((result, i) => {
                            if (result.error === 'NotRegistered')
                                user.devices.splice(user.devices.findIndex(device => device.token === GCMTokens[i]), 1);
                            else
                                console.log('Unhandled GCM error', result);
                        });
                    }

                    // save removed devices + send date
                    user.sendDate = new Date
                    await user.save();

                    resolve(response);
                }
            });
        });

        return sendResult;
    },

    async sendTypePostComment(notification: INotification, user) {
        const fromUser: any = await User.findById(notification.fromUserId, { name: 1 });

        const title = `${fromUser.name} responded on your post`;
        const body = notification.data.content;
        const data = {
            type: 'post-comment',
            commentId: notification.data.commentId,
            parentId: notification.data.parentId
        }

        return this.sendToUser(notification._id, notification.toUserId, title, body, data, user);
    },

    async sendTypePostLike(notification: INotification, user) {
        const fromUser: any = await User.findById(notification.fromUserId, { name: 1 });

        if (!fromUser)
            throw new Error('could not find user');

        const title = `${fromUser.name} liked your post`;
        const data = {
            type: 'post-like',
            commentId: notification.data.commentId,
        }

        return this.sendToUser(notification._id, notification.toUserId, title, '', data, user);
    },

    async sendTypeCommentLike(notification: INotification, user) {
        const fromUser: any = await User.findById(notification.fromUserId, { name: 1 });

        const title = `${fromUser.name} liked your comment`;
        const data = {
            type: 'comment-like',
            commentId: notification.data.commentId,
            parentId: notification.data.parentId
        }

        return this.sendToUser(notification._id, notification.toUserId, title, '', data, user);
    },

    async sendTypeSymbolAlarm(notification: INotification, user) {
        const title = `Price alarm triggered on ${notification.data.symbol} - ${notification.data.target}`;
        const data = {
            type: 'symbol-alarm',
            ...notification.data
        };

        return this.sendToUser(notification._id, notification.toUserId, title, '', data, user);
    },

    async sendUserFollow(notification: INotification, user) {
        const fromUser: any = await User.findById(notification.fromUserId, { name: 1 }).lean();

        const title = `${fromUser.name} started following you!`;

        const data = {
            type: 'symbol-alarm',
            fromUser
        };

        return this.sendToUser(notification._id, notification.toUserId, title, '', data, user);
    },

    async parse(notification: INotification) {
        const user = await User.findOneAndUpdate({ _id: notification.toUserId }, { $inc: { unreadCount: 1 } });
        const document = await this.create(notification);
        notification._id = document._id;

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

    async markUnread(reqUser: IReqUser, notificationId: string) {
        const notification = <any>await Notification.findById(notificationId);

        if (!notification)
            throw ({ statusCode: 404 });

        if (notification.toUserId.toString() !== reqUser.id)
            throw ({ statusCode: 401 });

        if (notification.readDate)
            return;

        notification.readDate = new Date;
        notification.isRead = true;

        await Promise.all([
            notification.save(),
            User.update({ _id: reqUser.id, unreadCount: { $gt: 0 } }, { $inc: { unreadCount: -1 } })
        ])
    },

    async markAllUnread(reqUser: IReqUser) {
        const results = await Promise.all([
            (<any>Notification).updateMany({ toUserId: reqUser.id }, { $set: { readDate: new Date, isRead: true } }),
            this.resetUnreadCount(reqUser)
        ]);
    },

    async resetUnreadCount(reqUser: IReqUser) {
        const result = await User.update({ _id: reqUser.id }, { unreadCount: 0 });
    }
};