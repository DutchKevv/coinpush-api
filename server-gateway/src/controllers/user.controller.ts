import * as url from 'url';
import * as request from 'request-promise';
import * as redis from '../modules/redis';
import {CHANNEL_TYPE_MAIN} from '../../../shared/constants/constants';

const config = require('../../../tradejs.config');

export const userController = {

	find(params): Promise<Array<any>> {
		return Promise.resolve([]);
	},

	async create(params) {
		try {
			// Create user
			const user = await request({
				uri: 'http://localhost:3002/social/user/',
				method: 'POST',
				body: params,
				json: true
			});

			console.log('user', user);

			// Create channel
			const channel = await request({
				uri: config.server.channel.apiUrl + '/channel',
				method: 'POST',
				headers: {
					'_id': user._id
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

			return user;

		} catch (error) {
			console.error(error);
			throw new Error('ERROR');
		}
	},

	update(userId, params) {

	},

	async toggleFollow(followerId, toFollowId?: boolean) {
// Get user main channel
		// Get user main channel
		const channel = await request({
			uri: config.server.channel.apiUrl + '/channel/',
			method: 'GET',
			headers: {'_id': followerId},
			qs: {
				user: toFollowId
			},
			json: true
		});

		// Subscribe to channel
		const result = await request({
			uri: config.server.channel.apiUrl + '/channel/' + channel.user[0]._id + '/follow',
			method: 'POST',
			headers: {
				'_id': followerId
			},
			json: true
		});

		return result;
	},

	async toggleCopy(followerId, toFollowId) {

		// Get user main channel
		const channel = await request({
			uri: config.server.channel.apiUrl + '/channel/',
			method: 'GET',
			headers: {'_id': followerId},
			qs: {
				user: toFollowId
			},
			json: true
		});

		// Subscribe to channel
		const result = await request({
			uri: config.server.channel.apiUrl + '/channel/' + channel.user[0]._id + '/copy',
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