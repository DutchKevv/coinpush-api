import * as request from 'request-promise';
import * as redis from '../modules/redis';
import {CHANNEL_TYPE_MAIN, REDIS_USER_PREFIX} from '../../../shared/constants/constants';
import {channelController} from './channel.controller';

const config = require('../../../tradejs.config');

export const userController = {

	async find(reqUser: {id: string}, userId: string, params: any = {}): Promise<any> {
		const results = await Promise.all([
			request({uri: config.server.user.apiUrl + '/user/' + userId, qs: {type: params.type}, headers: {_id: reqUser.id}, json: true}),
			request({uri: config.server.channel.apiUrl + '/channel/', qs: {user: userId}, headers: {_id: reqUser.id}, json: true}),
		]);

		console.log(results[0], results[1].user[0]);
		return Object.assign({}, results[0] || {}, results[1].user[0] || {});
	},

	async findMany(reqUserId: string, params): Promise<Array<any>> {
		return request({uri: config.server.user.apiUrl + '/user/' + reqUserId, json: true})
	},

	async create(reqUser, params): Promise<{user: any, channel: any}> {
		let user, channel;

		try {
			// create user
			user = await request({
				uri: config.server.user.apiUrl + '/user',
				method: 'POST',
				body: params,
				json: true
			});

			// create channel
			channel = await channelController.create({id: user._id}, {
				name: params.username,
				type: CHANNEL_TYPE_MAIN,
				profileImg: params.profileImg
			});

			return {user, channel};

		} catch (error) {
			if (user && user._id)
				this.remove(reqUser, user._id);

			if (channel && channel._id)
				channelController.remove(reqUser, channel._id);

			console.error(error);
			throw new Error(error);
		}
	},

	getOverviewList() {

	},

	async update(reqUser, params) {

		// create user
		return request({
			uri: config.server.user.apiUrl + '/user/' + reqUser.id,
			method: 'PUT',
			body: params,
			json: true
		});
	},

	/*
		TODO: Not request main channel but let channel service find user main channel
	 */
	async toggleFollow(reqUser, toFollowId?: boolean) {

		// Get user main channel
		const channel = await request({
			uri: config.server.channel.apiUrl + '/channel/',
			method: 'GET',
			headers: {'_id': reqUser.id},
			qs: {
				user: toFollowId
			},
			json: true
		});

		// Subscribe to channel
		const result = await channelController.toggleFollow(reqUser.id, channel.user[0]._id);

		return result;
	},

	/*
		TODO: Not request main channel but let channel service find user main channel
	 */
	async toggleCopy(reqUser, toFollowId) {

		// Get user main channel
		const channel = await request({
			uri: config.server.channel.apiUrl + '/channel/',
			method: 'GET',
			headers: {'_id': reqUser.id},
			qs: {
				user: toFollowId
			},
			json: true
		});

		// Subscribe to channel
		const result = await channelController.toggleCopy(reqUser.id, channel.user[0]._id);

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