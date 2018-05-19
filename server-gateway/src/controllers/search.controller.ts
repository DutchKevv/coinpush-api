import * as request from 'request-promise';

const config = require('../../../tradejs.config.js');

export const searchController = {

	async byText(reqUser, params?): Promise<any> {
		const results = await Promise.all([
			request({
				uri: config.server.user.apiUrl + '/user',
				headers: {_id: reqUser.id},
				qs: params,
				json: true
			})
		]);

		return {
			users: results[0]
		};
	}
};