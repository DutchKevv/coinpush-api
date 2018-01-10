import * as jwt from 'jsonwebtoken';
import * as request from 'request-promise';
import { userController } from "./user.controller";
import { G_ERROR_UNKNOWN } from "../../../shared/constants/constants";
import { log } from '../../../shared/logger';
import { IUser } from '../../../shared/interfaces/IUser.interface';
import { deviceController } from './device.controller';
import { symbolController } from './symbol.controller';
import { IReqUser } from '../../../shared/interfaces/IReqUser.interface';

const config = require('../../../tradejs.config');

export const authenticateController = {

	async authenticate(reqUser: IReqUser, params: { email?: string, password?: string, token?: string, device?: any }): Promise<any> {
		if (params.token) {
			if (reqUser.id && reqUser.id !== params.token)
				throw new Error('header token and param token do not match');
		} else {
			params.token = reqUser.id;
		}

		let user: IUser;
		let event: IUser;
		let unreadCount: number;
		console.log('111111');
		const results = await Promise.all([
			symbolController.getPublicList(),
			(async () => {
				console.log('asfdsfasfdfsdf');
				if (params.email || params.password || params.token) {
					params['fields'] = ['favorites', 'name', 'img'];
		
					user = await request({
						uri: config.server.user.apiUrl + '/authenticate',
						headers: {
							_id: reqUser.id
						},
						method: 'POST',
						body: params,
						json: true
					});
					
					if (user && user._id) {
						unreadCount = await request({
							uri: config.server.notify.apiUrl + '/notify/unread',
							headers: {
								_id: user._id
							}
						});
					}
				}
			})()
		])

		return {
			symbols: results[0],
			notifications: {
				unreadCount: unreadCount
			},
			user
		};
	},

	async requestPasswordReset(reqUser, email: string): Promise<void> {
		let user;

		try {
			user = await request({
				uri: config.server.user.apiUrl + '/authenticate/request-password-reset',
				headers: { '_id': reqUser.id },
				method: 'post',
				body: { email },
				json: true
			});
		} catch (error) {
			if (!error.error)
				throw ({ code: G_ERROR_UNKNOWN });

			return;
		}

		user.email = email;

		const result = await request({
			uri: config.server.notify.apiUrl + '/mail/request-password-reset',
			headers: { '_id': reqUser.id },
			method: 'POST',
			body: { user },
			json: true
		});

		console.log('reset', result);
	}
};
