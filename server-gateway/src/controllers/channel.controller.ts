import * as url from 'url';
import * as request from 'request-promise';
import * as redis from '../modules/redis';
import {CHANNEL_TYPE_MAIN} from '../../../shared/constants/constants';

const config = require('../../../tradejs.config');

export const channelController = {

	async find(reqUser, params): Promise<Array<any>> {

		return Promise.resolve([]);
	},

	async findMany(reqUser, params): Promise<Array<any>> {
		return await request({
			uri: config.server.channel.apiUrl + '/channel',
			headers: {'_id': reqUser.id},
			json: true
		});
	},

	create(reqUser, params: {name: string, type: number, profileImg?: string}) {

		return request({
			uri: config.server.channel.apiUrl + '/channel/',
			method: 'POST',
			headers: {
				'_id': reqUser.id
			},
			body: params,
			json: true
		});
	},

	update(reqUser, channelId, params) {
		return request({
			uri: config.server.channel.apiUrl + '/channel/' + channelId,
			method: 'PUT',
			headers: {
				'_id': reqUser.id
			},
			json: true
		});
	},

	updateByUserId(reqUser, userId, params) {
		return request({
			uri: config.server.channel.apiUrl + '/channel/',
			method: 'PUT',
			headers: {
				'_id': reqUser.id
			},
			qs: {
				user: userId
			},
			json: true
		});
	},

	async toggleFollow(followerId, channelId?: boolean) {
		// Subscribe to channel
		const result = await request({
			uri: config.server.channel.apiUrl + '/channel/' + channelId + '/follow',
			method: 'POST',
			headers: {
				'_id': followerId
			},
			json: true
		});

		return result;
	},

	async toggleCopy(followerId, channelId) {

		// Subscribe to channel
		const result = await request({
			uri: config.server.channel.apiUrl + '/channel/' + channelId + '/copy',
			method: 'POST',
			headers: {
				'_id': followerId
			},
			json: true
		});

		return result;
	},

	remove(reqUser, channelId) {

	}
};