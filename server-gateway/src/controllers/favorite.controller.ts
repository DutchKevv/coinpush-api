import * as request from 'request-promise';
import { config } from 'coinpush/src/util/util-config';

export const favoriteController = {

	async toggle(reqUser, params): Promise<any> {
		return request({
            uri: config.server.user.apiUrl + '/favorite',
            method: 'post',
            headers: {_id: reqUser.id},
            body: params,
            json: true
        })
	}
};