import * as url from 'url';
import * as request from 'request-promise';
import * as redis from '../modules/redis';
import {CHANNEL_TYPE_MAIN} from '../../../shared/constants/constants';

const config = require('../../../tradejs.config');

export const channelController = {

	findById(reqUser, channelId): Promise<any> {
		return request({
			uri: config.server.channel.apiUrl + '/channel/' + channelId,
			headers: {'_id': reqUser.id},
			json: true
		});
	},

	async findByUserId(reqUser, userId): Promise<any> {
		const result = await request({
			uri: config.server.channel.apiUrl + '/channel/',
			headers: {'_id': reqUser.id},
			qs: {
				user: userId
			},
			json: true
		});

		console.log('2222222', userId);

		if (result && result.user && result.user[0])
			return result.user[0];

		return undefined;
	},

	findMany(reqUser, params): Promise<Array<any>> {
		return request({
			uri: config.server.channel.apiUrl + '/channel',
			headers: {'_id': reqUser.id},
			json: true
		});
	},

	create(reqUser, params: { name: string, type: number, description?: string, profileImg?: string }) {

		return request({
			uri: config.server.channel.apiUrl + '/channel/',
			method: 'POST',
			headers: {'_id': reqUser.id},
			body: params,
			json: true
		});
	},

	update(reqUser, channelId, params) {
		return request({
			uri: config.server.channel.apiUrl + '/channel/' + channelId,
			method: 'PUT',
			body: params,
			headers: {'_id': reqUser.id},
			json: true
		});
	},

	updateByUserId(reqUser, userId, params) {
		return request({
			uri: config.server.channel.apiUrl + '/channel/',
			method: 'PUT',
			body: params,
			headers: {'_id': reqUser.id},
			qs: {user: userId},
			json: true
		});
	},

	async toggleFollow(followerId: string, channelId: string) {
		const result = await request({
			uri: config.server.channel.apiUrl + '/channel/' + channelId + '/follow',
			method: 'POST',
			headers: {'_id': followerId},
			json: true
		});

		return result;
	},

	async toggleCopy(followerId: string, channelId: string) {
		const result = await request({
			uri: config.server.channel.apiUrl + '/channel/' + channelId + '/copy',
			method: 'POST',
			headers: {'_id': followerId},
			json: true
		});

		return result;
	},

	remove(reqUser, channelId) {

	}
};