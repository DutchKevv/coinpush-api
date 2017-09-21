import * as request from 'request-promise';
import * as redis from '../modules/redis';
import {CHANNEL_TYPE_MAIN, REDIS_USER_PREFIX} from '../../../shared/constants/constants';
import {channelController} from './channel.controller';

const config = require('../../../tradejs.config');

export const userController = {

	async find(reqUser: {id: string}, userId: string, params: any = {}): Promise<any> {
		const user = await Promise.all([
			request({uri: 'http://localhost:3002/social/user/' + userId, qs: {type: params.type}, headers: {_id: reqUser.id}, json: true}),
			request({uri: 'http://localhost:3007/channel', qs: {user: userId}, headers: {_id: reqUser.id}, json: true}),
		]);
		console.log(user[0]);
		return Object.assign(user[0], user[1].user[0]);
	},

	async findMany(reqUserId: string, params): Promise<Array<any>> {
		return request({uri: 'http://localhost:3002/social/users/', json: true})
	},

	async create(reqUser, params) {
		let user, channel;

		try {
			// create user
			user = await request({
				uri: 'http://localhost:3002/social/user/',
				method: 'POST',
				body: params,
				json: true
			});

			// create channel
			channel = await channelController.create(reqUser, {
				name: params.username,
				type: CHANNEL_TYPE_MAIN
			});

			return user;

		} catch (error) {
			if (user && user._id)
				this.remove(reqUser, user._id);

			if (channel && channel._id)
				channelController.remove(reqUser, user._id);

			throw new Error(error);
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

	remove(reqUser, userId) {

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