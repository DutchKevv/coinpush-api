import * as jwt from 'jsonwebtoken';
import * as request from 'request-promise';
import { userController } from "./user.controller";
import { G_ERROR_UNKNOWN } from "../../../shared/constants/constants";
import { log } from '../../../shared/logger';
import { IUser } from '../../../shared/interfaces/IUser.interface';
import { deviceController } from './device.controller';

const config = require('../../../tradejs.config');

export const authenticateController = {

	async authenticate(reqUser, params: { email?: string, password?: string, token?: string, device?: any }): Promise<IUser> {

		params['fields'] = ['favorites', 'name', 'img'];

		const user = await request({
			uri: config.server.user.apiUrl + '/authenticate',
			headers: {
				_id: reqUser.id
			},
			method: 'POST',
			body: params,
			json: true
		});

		if (!user || !user.token)
			return null;

		if (params.device && params.device.token) {
			deviceController.add({ id: user._id }, params.device).catch(error => {
				console.error('TODO - FIX: could not set firebase device token for user: ', user._id);
			})
		}

		return user;
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
