import * as request from 'request-promise';
import * as redis from '../modules/redis';
import {CHANNEL_TYPE_MAIN, USER_FETCH_TYPE_ACCOUNT_DETAILS, USER_FETCH_TYPE_FULL} from '../../../shared/constants/constants';
import {channelController} from './channel.controller';

const config = require('../../../tradejs.config');

export const userController = {

	async find(reqUser: { id: string }, userId: string, params: any = {}): Promise<any> {

		const results = await Promise.all([
			this._getUser(reqUser, userId, params.type),
			channelController.findByUserId(reqUser, userId),
		]);

		return Object.assign({}, results[0] || {}, results[1] || {});
	},

	async findMany(reqUser: {id: string}, params): Promise<Array<any>> {
		return request({uri: config.server.user.apiUrl + '/user/' + reqUser.id, json: true})
	},

	async getBalance(reqUser, userId) {
		const user = await this._getUser(reqUser, userId, USER_FETCH_TYPE_ACCOUNT_DETAILS);

		if (user) {
			return user.balance;
		}
	},

	async create(reqUser, params): Promise<{ user: any, channel: any }> {
		let user, channel;

		try {
			// create user
			user = await request({
				uri: config.server.user.apiUrl + '/user',
				headers: {'_id': reqUser.id},
				method: 'POST',
				body: {
					name: params.username,
					email: params.email,
					password: params.password,
					country: params.country
				},
				json: true
			});

			// create channel
			channel = await channelController.create({id: user._id}, {
				name: params.username,
				description: params.description,
				type: CHANNEL_TYPE_MAIN,
				profileImg: params.profileImg
			});

			// update user with channel id
			await this.update({id: user._id}, user._id, {
				c_id: channel._id
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

	async update(reqUser, userId, params): Promise<void> {
		const result = await Promise.all([
			request({
				uri: config.server.user.apiUrl + '/user/' + userId,
				headers: {'_id': reqUser.id},
				method: 'PUT',
				body: params,
				json: true
			}),
			channelController.updateByUserId(reqUser, userId, params)
		]);
	},

	async updatePassword(reqUser, token, password): Promise<void> {
		const result = await request({
			uri: config.server.user.apiUrl + '/user/password',
			headers: {'_id': reqUser.id},
			method: 'PUT',
			body: {
				token,
				password
			},
			json: true
		});

		console.log('UDPATE ERSULT', result);
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

	async resetPassword(reqUser, userId?: string) {
		return request({
			uri: config.server.user.apiUrl + '/user/' + reqUser.id,
			headers: {'_id': reqUser.id},
			method: 'PUT',
			body: {},
			json: true
		});
	},

	remove(reqUser, userId) {

	},

	_getUser(reqUser, userId, type) {
		return request({uri: config.server.user.apiUrl + '/user/' + userId, qs: {type}, headers: {_id: reqUser.id}, json: true})
	}
};