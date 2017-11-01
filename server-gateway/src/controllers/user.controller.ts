import * as request from 'request-promise';
import * as redis from '../modules/redis';
import { CHANNEL_TYPE_MAIN, USER_FETCH_TYPE_ACCOUNT_DETAILS, USER_FETCH_TYPE_FULL, USER_FETCH_TYPE_PROFILE_SETTINGS } from '../../../shared/constants/constants';
import { channelController } from './channel.controller';

const config = require('../../../tradejs.config');

export const userController = {

	async findById(reqUser: { id: string }, userId: string, params: any = {}): Promise<any> {
		const pList = [
			this._getUser(reqUser, userId, params.type),
			channelController.findByUserId(reqUser, userId),
		];

		if (params.type === USER_FETCH_TYPE_PROFILE_SETTINGS) {
			pList.push(request({
				uri: config.server.email.apiUrl + '/user/' + userId,
				headers: { '_id': reqUser.id },
				qs: {
					type: params.type
				}
			}));
		}

		const results = await Promise.all(pList);

		return Object.assign({}, results[0] || {}, results[1] || {}, results[2] || {});
	},

	async findMany(reqUser: { id: string }, params): Promise<Array<any>> {
		return request({ uri: config.server.user.apiUrl + '/user/' + reqUser.id, json: true })
	},

	async getBalance(reqUser, userId) {
		const user = await this._getUser(reqUser, userId, USER_FETCH_TYPE_ACCOUNT_DETAILS);

		if (user) {
			return user.balance;
		}
	},

	async create(reqUser, params): Promise<{ user: any, channel: any }> {
		let user, channel, email;

		try {
			// create user
			user = await request({
				uri: config.server.user.apiUrl + '/user',
				headers: { '_id': reqUser.id },
				method: 'POST',
				body: {
					name: params.name,
					email: params.email,
					password: params.password,
					country: params.country
				},
				json: true
			});

			// channel
			channel = await request({
				uri: config.server.channel.apiUrl + '/user',
				headers: { '_id': user._id },
				method: 'POST',
				body: {
					name: params.name,
					profileImg: params.profileImg,
					description: params.description,
				},
				json: true
			});

			// // update user with channel id
			// await this.update(reqUser, user._id, {
			// 	c_id: channel._id
			// });

			// comment
			// await request({
			// 	uri: config.server.comment.apiUrl + '/user',
			// 	headers: { '_id': user._id },
			// 	method: 'POST',
			// 	body: user,
			// 	json: true
			// });

			// email
			email = await request({
				uri: config.server.email.apiUrl + '/user',
				headers: { '_id': user._id },
				method: 'POST',
				body: user,
				json: true
			});

			// send newMember email
			await request({
				uri: config.server.email.apiUrl + '/mail/new-member',
				headers: { '_id': user._id },
				method: 'POST',
				body: {
					userId: user._id
				},
				json: true
			});

			return { user, channel };

		} catch (error) {
			if (user && user._id) {
				try {
					await this.remove({id: user._id}, user._id)
				} catch (error) {
					console.error(error);
				}
			}

			throw error;
		}
	},

	async update(reqUser, userId, params): Promise<void> {
		// TODO: security
		if (reqUser.id !== userId)
			throw ({ code: 0, message: 'Not allowed' });

		const results = await Promise.all([
			// user
			request({
				uri: config.server.user.apiUrl + '/user/' + userId,
				headers: { '_id': reqUser.id },
				method: 'PUT',
				body: params,
				json: true
			}),
			// channel
			channelController.updateByUserId(reqUser, userId, params),
			// email
			request({
				uri: config.server.email.apiUrl + '/user/' + userId,
				headers: { '_id': reqUser.id },
				method: 'PUT',
				body: params,
				json: true
			})
		]);
	},

	async updatePassword(reqUser, token, password): Promise<void> {
		const result = await request({
			uri: config.server.user.apiUrl + '/user/password',
			headers: { '_id': reqUser.id },
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
			headers: { '_id': reqUser.id },
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
			headers: { '_id': reqUser.id },
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
			headers: { '_id': reqUser.id },
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
			headers: { '_id': reqUser.id },
			method: 'PUT',
			body: {},
			json: true
		});
	},

	async remove(reqUser, userId: string) {
		let user, channel, email;

		// user
		user = await request({
			uri: config.server.user.apiUrl + '/user/' + userId,
			headers: { '_id': reqUser.id },
			method: 'DELETE'
		});
		
		// channel
		try {
			channel = await request({
				uri: config.server.channel.apiUrl + '/user/' + userId,
				headers: { '_id': reqUser.id },
				method: 'DELETE'
			});
		} catch (error) {
			console.error(error);
		}

		// email
		try {
			email = await request({
				uri: config.server.email.apiUrl + '/user/' + userId,
				headers: { '_id': reqUser.id },
				method: 'DELETE'
			});
		} catch (error) {
			console.error(error);
		}
	},

	_getUser(reqUser, userId, type) {
		return request({ uri: config.server.user.apiUrl + '/user/' + userId, qs: { type }, headers: { _id: reqUser.id }, json: true })
	}
};