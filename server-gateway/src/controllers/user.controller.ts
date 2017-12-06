import * as request from 'request-promise';
import * as redis from '../modules/redis';
import { USER_FETCH_TYPE_ACCOUNT_DETAILS, USER_FETCH_TYPE_FULL, USER_FETCH_TYPE_PROFILE_SETTINGS } from '../../../shared/constants/constants';
import { emailController } from './email.controller';
import { IReqUser } from '../../../shared/interfaces/IReqUser.interface';
import { IUser } from '../../../shared/interfaces/IUser.interface';

const config = require('../../../tradejs.config');

export const userController = {

	async findById(reqUser: IReqUser, userId: string, options: any = {}): Promise<any> {

		const pList = [this._getUser(reqUser, userId, options.type)];

		if (options.type === USER_FETCH_TYPE_PROFILE_SETTINGS)
			pList.push(emailController.findUserById(reqUser, userId, options));

		const results = await Promise.all(pList);

		console.log('asdff', results);

		return Object.assign(results[0] || {}, results[1] || {});
	},

	async findMany(reqUser: IReqUser, params): Promise<Array<any>> {
		return request({ uri: config.server.user.apiUrl + '/user/', json: true })
	},

	async getBalance(reqUser: IReqUser, userId) {
		const user = await this._getUser(reqUser, userId, USER_FETCH_TYPE_ACCOUNT_DETAILS);

		if (user) {
			return user.balance;
		}
	},

	async create(reqUser: IReqUser, params: IUser): Promise<IUser> {
		let user, notify;

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
			console.log(1);
			// notify
			notify = await emailController.addUser({ id: user._id }, {
				_id: user._id,
				name: user.name,
				email: user.email,
				language: user.language
			});
			console.log(12);
			// comment
			await request({
				uri: config.server.comment.apiUrl + '/user',
				headers: { '_id': user._id },
				method: 'POST',
				body: {
					_id: user._id,
					name: user.name,
					img: user.img,
				},
				json: true
			});
			console.log(120000);
			// send newMember email
			await request({
				uri: config.server.notify.apiUrl + '/mail/new-member',
				headers: { '_id': user._id },
				method: 'POST',
				body: {
					userId: user._id
				},
				json: true
			});

			return user;

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

	async update(reqUser: IReqUser, userId: string, params: IUser): Promise<void> {
		// TODO: security
		if (reqUser.id !== userId)
			throw ({ code: 0, message: 'Not allowed' });

		const pList = [];
		const keys = Object.keys(params);

		if (keys.includes('name') || keys.includes('img')) {
			
		}

		const results = await Promise.all([
			// user
			request({
				uri: config.server.user.apiUrl + '/user/' + userId,
				headers: { '_id': reqUser.id },
				method: 'PUT',
				body: params,
				json: true
			}),

			// comment
			request({
				uri: config.server.comment.apiUrl + '/user/' + userId,
				headers: { '_id': reqUser.id },
				method: 'PUT',
				body: params,
				json: true
			}),

			// notify
			request({
				uri: config.server.notify.apiUrl + '/user/' + userId,
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

	async toggleFollow(reqUser: IReqUser, toFollowUserId: string) {
		const result = await request({
			uri: config.server.user.apiUrl + '/user/' + toFollowUserId + '/follow',
			method: 'POST',
			headers: { '_id': reqUser.id },
			json: true
		});

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
		let user, notify, comment;

		// user
		user = await request({
			uri: config.server.user.apiUrl + '/user/' + userId,
			headers: { '_id': reqUser.id },
			method: 'DELETE'
		});

		// comment
		try {
			comment = await request({
				uri: config.server.comment.apiUrl + '/user/' + userId,
				headers: { '_id': reqUser.id },
				method: 'DELETE'
			});
		} catch (error) {
			console.error(error);
		}

		// notify
		try {
			notify = await request({
				uri: config.server.notify.apiUrl + '/user/' + userId,
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