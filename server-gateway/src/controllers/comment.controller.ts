import * as request from 'request-promise';
import {userController} from "./user.controller";
import {channelController} from "./channel.controller";

const config = require('../../../tradejs.config');

export const commentController = {

	findById(reqUser, channelId): Promise<any> {
		return request({
			uri: config.server.comment.apiUrl + '/channel/' + channelId,
			headers: {'_id': reqUser.id},
			json: true
		});
	},

	async findByChannelId(reqUser: {id: string}, channelId: string, fields?: Array<string>): Promise<any> {
		const result = await request({
			uri: config.server.comment.apiUrl + '/comment/',
			headers: {'_id': reqUser.id},
			qs: {
				channel: channelId,
				fields: fields
			},
			json: true
		});

		return result;
	},

	findMany(reqUser, params): Promise<Array<any>> {
		return request({
			uri: config.server.comment.apiUrl + '/channel',
			headers: {'_id': reqUser.id},
			json: true
		});
	},

	async create(reqUser, params): Promise<any> {
		// get username and profileImg
		const user = await channelController.findByUserId(reqUser, reqUser.id, ['name', 'profileImg', 'c_id']);

		if (!user)
			throw new Error('user not found');

		return request({
			uri: config.server.comment.apiUrl + '/comment/',
			method: 'POST',
			headers: {'_id': reqUser.id},
			body: {
				...params,
				...user
			},
			json: true
		});
	},

	toggleLike(reqUser, commentId) {
		return request({
			uri: config.server.comment.apiUrl + '/comment/like/' + commentId,
			method: 'POST',
			headers: {'_id': reqUser.id},
			json: true
		});
	},

	update(reqUser, channelId, params) {
		return request({
			uri: config.server.comment.apiUrl + '/channel/' + channelId,
			method: 'PUT',
			body: params,
			headers: {'_id': reqUser.id},
			json: true
		});
	},

	updateByUserId(reqUser, userId, params) {
		return request({
			uri: config.server.comment.apiUrl + '/channel/',
			method: 'PUT',
			body: params,
			headers: {'_id': reqUser.id},
			qs: {user: userId},
			json: true
		});
	},

	async toggleFollow(followerId: string, channelId: string) {
		const result = await request({
			uri: config.server.comment.apiUrl + '/channel/' + channelId + '/follow',
			method: 'POST',
			headers: {'_id': followerId},
			json: true
		});

		return result;
	},

	async toggleCopy(followerId: string, channelId: string) {
		const result = await request({
			uri: config.server.comment.apiUrl + '/channel/' + channelId + '/copy',
			method: 'POST',
			headers: {'_id': followerId},
			json: true
		});

		return result;
	},

	remove(reqUser, channelId) {

	}
};