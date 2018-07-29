import * as request from 'request-promise';
import { config } from 'coinpush/src/util/util-config';

export const timelineController = {

	async get(reqUser, params?): Promise<any> {
		return request({
			uri: config.server.comment.apiUrl + '/timeline',
			headers: { _id: reqUser.id },
			qs: params,
			json: true
		});
	}
};