import * as request from 'request-promise';
import { IReqUser } from 'coinpush/interface/IReqUser.interface';

const config = require('../../../coinpush.config.js');

export const notifyController = {

    findById(reqUser: IReqUser, notificationId, params) {
        return request({
            uri: config.server.notify.apiUrl + '/notify/' + notificationId,
            headers: { _id: reqUser.id },
            qs: params,
            json: true
        })
    },

    findMany(reqUser: IReqUser, params) {
        return request({
            uri: config.server.notify.apiUrl + '/notify',
            headers: { _id: reqUser.id },
            qs: params,
            json: true
        })
    },

    update(reqUser: IReqUser, notificationId: string, params) {
        return request({
            uri: config.server.notify.apiUrl + '/notify',
            method: 'put',
            headers: { _id: reqUser.id },
            body: params,
            json: true
        })
    },

    markUnread(reqUser: IReqUser, notificationId: string) {
        return request({
            uri: config.server.notify.apiUrl + '/notify/unread/' + notificationId,
            method: 'put',
            headers: { _id: reqUser.id }
        })
    },

    markAllUnread(reqUser: IReqUser) {
        return request({
            uri: config.server.notify.apiUrl + '/notify/unread',
            method: 'put',
            headers: { _id: reqUser.id }
        })
    },

    getUnreadCount(reqUser: IReqUser): Promise<number> {
        return request({
            uri: config.server.notify.apiUrl + '/notify/unread',
            headers: {
                _id: reqUser.id
            }
        })
    },

    resetUnreadCount(reqUser: IReqUser) {
        return request({
            uri: config.server.notify.apiUrl + '/notify/reset-unread-counter',
            method: 'put',
            headers: { _id: reqUser.id },
        })
    },

    remove(reqUser: IReqUser, eventId) {
        return request({
            uri: config.server.notify.apiUrl + '/notify/' + eventId,
            method: 'delete',
            headers: { _id: reqUser.id }
        })
    }
};