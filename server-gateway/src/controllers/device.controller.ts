import * as request from 'request-promise';
import { IReqUser } from 'coinpush/src/interface/IReqUser.interface';
import { config } from 'coinpush/src/util/util-config';

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