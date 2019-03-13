import * as request from 'request-promise';
import { config } from 'coinpush/src/util/util-config';
import { userController } from './user.controller';

export const timelineController = {

	async get(reqUser, params?): Promise<any> {

		let comments: [];

		try {
			comments = await request({
				uri: 'http://elk:9200/comments/_search',
				// uri: 'http://elk:9200/comments/_search?&sort=createdAt:desc',
				headers: { _id: reqUser.id },
				json: true,
				fullResponse: false
			});

			comments = comments['hits']['hits'].map(comment => comment._source);
		} catch (error) {
			console.log('ELK ERROR - ', error);

			comments = await request({
				uri: config.server.comment.apiUrl + '/timeline',
				headers: { _id: reqUser.id },
				qs: params,
				json: true,
				fullResponse: false
			});
		}


		return comments;
	},

	async setUsers(reqUser, comments) {
		let userIds = [];
		comments.forEach((comment: any) => {
			userIds.push(comment.createUser);

			(comment.children || []).forEach((child: any) => {
				userIds.push(child.createUser);
			});
		});

		userIds = [...new Set(userIds)];

		const users = await userController.findMany(reqUser, { userIds, fields: ['_id', 'name', 'img'] });

		comments.forEach(comment => {
			comment.createUser = users.find(user => user._id === comment.createUser);

			(comment.children || []).forEach(child => {
				child.createUser = users.find(user => user._id === child.createUser);
			});
		});
	}
};