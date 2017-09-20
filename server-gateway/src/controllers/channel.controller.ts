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

	async create(userId, params) {
		try {

			// Create channel
			const channel = await request({
				uri: config.server.channel.apiUrl + '/channel/',
				method: 'POST',
				headers: {
					'_id': userId
				},
				body: {
					name: 'main',
					type: CHANNEL_TYPE_MAIN
				},
				json: true
			});

			console.log('channel', channel);

			// // Update user with main channel
			// const result = await request({
			// 	uri: 'http://localhost:3002/social/user/' + user._id + '/',
			// 	method: 'PUT',
			// 	headers: {
			// 		'_id': user._id
			// 	},
			// 	body: {
			// 		channels: [channel._id]
			// 	},
			// 	json: true
			// });
			//
			// console.log('RESULT RESULT RESULT!!', result);

			return channel;

		} catch (error) {
			console.error(error);
			throw new Error('ERROR');
		}
	},

	update(userId, params) {

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

	remove() {

	}
};