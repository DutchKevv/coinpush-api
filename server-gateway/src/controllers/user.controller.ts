import * as request from 'request-promise';
import * as redis from '../modules/redis';
import { CHANNEL_TYPE_MAIN, USER_FETCH_TYPE_ACCOUNT_DETAILS, USER_FETCH_TYPE_FULL, USER_FETCH_TYPE_PROFILE_SETTINGS } from '../../../shared/constants/constants';
import { channelController } from './channel.controller';
import { emailController } from './email.controller';
import { IReqUser } from '../../../shared/interfaces/IReqUser.interface';
import { IUser } from '../../../shared/interfaces/IUser.interface';

const config = require('../../../tradejs.config');

export const userController = {

	async findById(reqUser: IReqUser, userId: string, options: { type?: number, fields?: Array<string> } = {}): Promise<any> {

		console.log('asdfsdf', options);
		
		const pList = [
			this._getUser(reqUser, userId, options.type),
			channelController.findByUserId(reqUser, userId, options),
		];

		if (options.type === USER_FETCH_TYPE_PROFILE_SETTINGS)
			pList.push(emailController.findUserById(reqUser, userId, options));

		const results = await Promise.all(pList);

		console.log('asdff', results, );

		// Remove channel _id & user_id cause it overwrites the user id's
		if (results[1]) {
			delete results[1]._id;
			delete results[1].user_id;
		}

		return Object.assign({}, results[0] || {}, results[1] || {}, results[2] || {});
	},

	async findMany(reqUser: IReqUser, params): Promise<Array<any>> {
		return request({ uri: config.server.user.apiUrl + '/user/' + reqUser.id, json: true })
	},

	async getBalance(reqUser: IReqUser, userId) {
		const user = await this._getUser(reqUser, userId, USER_FETCH_TYPE_ACCOUNT_DETAILS);

		if (user) {
			return user.balance;
		}
	},

	async create(reqUser: IReqUser, params: IUser): Promise<{ user: any, channel: any }> {
		let user, channel, email;

		try {
			// create user
			user = await request({
				uri: config.server.user.apiUrl + '/user',
				headers: { '_id': reqUser.id },
				method: 'POST',
				body: {
					name: params.name,
					gender: params.gender,
					email: params.email,
					password: params.password,
					country: params.country,
					language: params.language
				},
				json: true
			});

			// channel
			channel = channelController.addUser({ id: user._id }, {
				_id: user._id,
				name: user.name,
				description: user.description
			});

			// update user c_id
			// TODO : REMOVE FUCKING C_ID
			await this.update({ id: user._id }, { c_id: channel._id });

			// email
			email = await emailController.addUser({ id: user._id }, {
				_id: user._id,
				name: user.name,
				email: user.email,
				language: user.language
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
					await this.remove({ id: user._id }, user._id)
				} catch (error) {
					console.error(error);
				}
			}

			throw error;
		}
	},

	async update(reqUser: IReqUser, userId, params): Promise<void> {
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

	async updatePassword(reqUser: IReqUser, token, password): Promise<void> {
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

	updateBalance(reqUser: IReqUser, params) {
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
	async toggleFollow(reqUser: IReqUser, toFollowId?: boolean) {

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
	async toggleCopy(reqUser: IReqUser, toFollowId) {

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

	async resetPassword(reqUser: IReqUser, userId?: string) {
		return request({
			uri: config.server.user.apiUrl + '/user/' + reqUser.id,
			headers: { '_id': reqUser.id },
			method: 'PUT',
			body: {},
			json: true
		});
	},

	async remove(reqUser: IReqUser, userId: string) {
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

	_getUser(reqUser: IReqUser, userId, type) {
		return request({ uri: config.server.user.apiUrl + '/user/' + userId, qs: { type }, headers: { _id: reqUser.id }, json: true })
	}
};