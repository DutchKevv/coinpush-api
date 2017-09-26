import * as request from 'request-promise';

const config = require('../../../tradejs.config');

export const searchController = {

	async byText(reqUser, params?): Promise<any> {

		const results = await Promise.all([
			request({
				uri: config.server.channel.apiUrl + '/search',
				method: 'get',
				headers: {_id: reqUser.id},
				qs: params,
				json: true
			})
		]);

		console.log(results);

		return {
			users: results[0]
		};
	}
};