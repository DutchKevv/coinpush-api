import * as request from 'request-promise';
import { IReqUser } from 'coinpush/interface/IReqUser.interface';

const config = require('../../../tradejs.config.js');

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

	remove(reqUser: IReqUser, token: string): Promise<any> {
		return request({
			uri: config.server.notify.apiUrl + '/device/' + token,
			method: 'delete',
			headers: {'_id': reqUser.id},
			json: true
		});
	}
};