import * as request from 'request-promise';
import { USER_FETCH_TYPE_ACCOUNT_DETAILS, USER_FETCH_TYPE_FULL, USER_FETCH_TYPE_PROFILE_SETTINGS } from 'coinpush/constant';
import { emailController } from './email.controller';
import { IReqUser } from 'coinpush/interface/IReqUser.interface';
import { IUser } from 'coinpush/interface/IUser.interface';
import { downloadProfileImgFromUrl } from '../api/upload.api';
import { commentController } from './comment.controller';

const config = require('../../../tradejs.config.js');

export const userController = {

	async findById(reqUser: IReqUser, userId: string, options: any = {}): Promise<any> {

		const pList = [this._getUser(reqUser, userId, options.type)];

		if (options.type === USER_FETCH_TYPE_PROFILE_SETTINGS)
			pList.push(emailController.findUserById(reqUser, userId, options));

		const results = await Promise.all(pList);

		return Object.assign(results[0] || {}, results[1] || {});
	},

	findByFacebookId(reqUser: IReqUser, facebookId) {
		return request({
			uri: config.server.user.apiUrl + '/user/',
			headers: { '_id': reqUser.id },
			qs: {
				facebookId
			},
			json: true
		})
	},

	findMany(reqUser: IReqUser, params): Promise<Array<any>> {
		return request({
			uri: config.server.user.apiUrl + '/user/',
			headers: { '_id': reqUser.id },
			json: true
		})
	},

	async getBalance(reqUser: IReqUser, userId) {
		const user = await this._getUser(reqUser, userId, USER_FETCH_TYPE_ACCOUNT_DETAILS);

		if (user) {
			return user.balance;
		}
	},

	async create(reqUser: IReqUser, params: IUser, sendEmail = true): Promise<IUser> {
		let user, notify;

		try {

			// create initial user
			user = await request({
				uri: config.server.user.apiUrl + '/user',
				headers: { '_id': reqUser.id },
				method: 'POST',
				body: params,
				json: true
			});

			// create user on other services
			await Promise.all([
				// notify
				emailController.addUser({ id: user._id }, {
					_id: user._id,
					img: user.img,
					name: user.name,
					email: user.email,
					language: user.language
				}),
				// comment
				commentController.addUser({ id: user._id }, {
					_id: user._id,
					img: user.img,
					name: user.name,
				})
			]);

			// download (async) profile image (facebook etc)
			if (params.imgUrl) {
				downloadProfileImgFromUrl({ id: user._id }, params.imgUrl)
					.then((fileName: string) => {
						if (typeof fileName === 'string' && fileName.length)
							return this.update({ id: user._id }, user._id, { img: fileName })
					})
					.catch(console.error)
			}

			// send newMember email
			if (sendEmail) {
				request({
					uri: config.server.notify.apiUrl + '/mail/new-member',
					headers: { '_id': user._id },
					method: 'POST',
					body: {
						userId: user._id
					},
					json: true
				}).catch(console.error);
			}

			return user;

		} catch (error) {
			console.error(error);

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
		return request({
			uri: config.server.user.apiUrl + '/user/' + userId,
			headers: { _id: reqUser.id },
			qs: { type },
			json: true
		});
	}
};