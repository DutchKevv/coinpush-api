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

	findByUserId(reqUser, userId): Promise<any> {
		return request({
			uri: config.server.channel.apiUrl + '/channel/',
			headers: {'_id': reqUser.id},
			qs: {
				user: userId
			},
			json: true
		});
	},

	findMany(reqUser, params): Promise<Array<any>> {
		return request({
			uri: config.server.channel.apiUrl + '/channel',
			headers: {'_id': reqUser.id},
			json: true
		});
	},

	create(reqUser, params: { name: string, type: number, profileImg?: string }) {

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