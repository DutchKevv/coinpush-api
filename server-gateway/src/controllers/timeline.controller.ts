import * as request from 'request-promise';
import { config } from 'coinpush/src/util/util-config';

export const timelineController = {

	async get(reqUser, params?): Promise<any> {
		console.log('asdfasdf');

		let comments: [];

		try {
			comments = await request({
				uri: 'http://elk:9200/comments/_search',
				headers: { _id: reqUser.id },
				json: true,
				fullResponse: false
			});

			comments = comments['hits']['hits'].map(comment => comment._source);
		} catch (error) {
			console.error(error);

			comments = await request({
				uri: config.server.comment.apiUrl + '/timeline',
				headers: { _id: reqUser.id },
				qs: params,
				json: true,
				fullResponse: false
			});
		}


		return comments;
	}
};