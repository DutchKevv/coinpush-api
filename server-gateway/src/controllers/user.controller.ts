import * as url from 'url';
import * as request from 'request-promise';
import * as redis from '../modules/redis';
import {CHANNEL_TYPE_MAIN, REDIS_USER_PREFIX} from '../../../shared/constants/constants';
import {channelController} from './channel.controller';

const config = require('../../../tradejs.config');

export const userController = {

	async find(reqUser: {id: string}, userId: string): Promise<Array<any>> {
		return Promise.resolve([]);
	},

	async findMany(reqUserId: string, params): Promise<Array<any>> {

		const results = await Promise.all([
			this.find(reqUserId),
			request({uri: 'http://localhost:3002/social/users/', json: true})
		]);

		console.log(results);

		return results[1];
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

	getOverviewList() {

	},

	update(userId, params) {

	},

	/*
		TODO: Not request main channel but let channel service find user main channel
	 */
	async toggleFollow(followerId, toFollowId?: boolean) {

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
		const result = await channelController.toggleFollow(followerId, channel.user[0]._id);

		return result;
	},

	/*
		TODO: Not request main channel but let channel service find user main channel
	 */
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
		const result = await channelController.toggleCopy(followerId, channel.user[0]._id);

		return result;
	},

	remove() {

	},

	getSelf(userId: string): Promise<any> {
		let REDIS_KEY = REDIS_USER_PREFIX + userId;

		return new Promise((resolve, reject) => {
			redis.client.get(REDIS_KEY, (err, content) => {
				if (!err)
					return resolve(JSON.parse(content));

				this.find(userId);
			});
		});
	}
};