import * as request from 'request-promise';
import * as redis from '../modules/redis';
import {CHANNEL_TYPE_MAIN, USER_FETCH_TYPE_ACCOUNT_DETAILS, USER_FETCH_TYPE_FULL} from '../../../shared/constants/constants';
import {channelController} from './channel.controller';

const config = require('../../../tradejs.config');

export const userController = {

	async find(reqUser: {id: string}, userId: string, params: any = {}): Promise<any> {

		const results = await Promise.all([
			this._getUser(reqUser, userId, params.type),
			channelController.findByUserId(reqUser, userId),
		]);

		return Object.assign({}, results[0] || {}, results[1].user[0] || {});
	},

	async findMany(reqUserId: string, params): Promise<Array<any>> {
		return request({uri: config.server.user.apiUrl + '/user/' + reqUserId, json: true})
	},

	async getBalance(reqUser, userId) {
		const user = await this._getUser(reqUser, userId, USER_FETCH_TYPE_ACCOUNT_DETAILS);

		if (user) {
			return user.balance;
		}
	},

	async create(reqUser, params): Promise<{user: any, channel: any}> {
		let user, channel;

		try {
			// create user
			user = await request({
				uri: config.server.user.apiUrl + '/user',
				headers: {'_id': reqUser.id},
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

	update(reqUser, params) {
		return request({
			uri: config.server.user.apiUrl + '/user/' + reqUser.id,
			headers: {'_id': reqUser.id},
			method: 'PUT',
			body: params,
			json: true
		});
	},

	updateBalance(reqUser, params) {
		return request({
			uri: config.server.user.apiUrl + '/wallet/' + reqUser.id,
			headers: {'_id': reqUser.id},
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

	_getUser(reqUser, userId, type) {
		return request({uri: config.server.user.apiUrl + '/user/' + userId, qs: {type}, headers: {_id: reqUser.id}, json: true})
	}
};