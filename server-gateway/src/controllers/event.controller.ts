import * as request from 'request-promise';
import {BROKER_ERROR_NOT_ENOUGH_FUNDS} from '../../../shared/constants/constants';
import {userController} from './user.controller';
import { IReqUser } from '../../../shared/interfaces/IReqUser.interface';

const config = require('../../../tradejs.config');

export const eventController = {

	findById(reqUser: IReqUser, eventId) {
		return request({
            uri: config.server.event.apiUrl + '/event/' + eventId,
            headers: {_id: reqUser.id},
            json: true
        })
    },
    
    findMany(reqUser: IReqUser, params?: any) {
        return request({
            uri: config.server.event.apiUrl + '/event',
            headers: {_id: reqUser.id},
            qs: params,
            json: true
        })
    },

	create(reqUser: IReqUser, params) {
		return request({
            uri: config.server.event.apiUrl + '/event',
            method: 'post',
            headers: {_id: reqUser.id},
            body: params,
            json: true
        })
	},

	remove(reqUser: IReqUser, eventId: string) {
        return request({
            uri: config.server.event.apiUrl + '/event/' + eventId,
            method: 'delete',
            headers: {_id: reqUser.id}
        })
	}
};