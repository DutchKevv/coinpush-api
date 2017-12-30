import * as request from 'request-promise';
import { IReqUser } from '../../../shared/interfaces/IReqUser.interface';

const config = require('../../../tradejs.config');

export const deviceController = {

	async add(reqUser: IReqUser, params): Promise<any> {
		return request({
			uri: config.server.notify.apiUrl + '/device',
			method: 'post',
			headers: {'_id': reqUser.id},
			body: params,
			json: true
		});
	},

	remove(reqUser: IReqUser, commentId): Promise<any> {
		return request({
			uri: config.server.notify.apiUrl + '/device' + commentId,
			method: 'delete',
			headers: {'_id': reqUser.id},
			json: true
		});
	}
};