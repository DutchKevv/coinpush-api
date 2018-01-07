import * as request from 'request-promise';
import { IReqUser } from '../../../shared/interfaces/IReqUser.interface';

const config = require('../../../tradejs.config');

export const notifyController = {

	findById(reqUser: IReqUser, notificationId, params) {
		return request({
            uri: config.server.notify.apiUrl + '/notify/' + notificationId,
            headers: {_id: reqUser.id},
            qs: params,
            json: true
        })
    },
    
    findMany(reqUser: IReqUser, params) {
        return request({
            uri: config.server.notify.apiUrl + '/notify',
            headers: {_id: reqUser.id},
            qs: params,
            json: true
        })
    },

	update(reqUser: IReqUser, notificationId: string, params) {
		return request({
            uri: config.server.notify.apiUrl + '/notify',
            method: 'put',
            headers: {_id: reqUser.id},
            body: params,
            json: true
        })
	},

	remove(reqUser: IReqUser, eventId) {
        return request({
            uri: config.server.notify.apiUrl + '/notify/' + eventId,
            method: 'delete',
            headers: {_id: reqUser.id}
        })
	}
};