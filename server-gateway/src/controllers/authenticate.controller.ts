import * as jwt from 'jsonwebtoken';
import * as request from 'request-promise';
import { channelController } from './channel.controller';
import { userController } from "./user.controller";
import { G_ERROR_UNKNOWN } from "../../../shared/constants/constants";
import { log } from '../../../shared/logger';

const config = require('../../../tradejs.config');

export const authenticateController = {

	async authenticate(reqUser, params: { email?: string, password?: string, token?: string, device?: string }): Promise<any> {

		params['fields'] = ['balance', 'leverage', 'favorites', 'c_id'];

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

		if (params.device) {
			userController
				.update({ id: user._id }, user._id, <any>{ device: params.device })
				.then(() => {
					log.info('AuthenticateController', 'added device id (firebase) to notify service')
				})
				.catch(error => {
					console.error('TODO - FIX: could not set firebase device token for user: ', user._id);
				})
		}

		const channel = await channelController.findByUserId({ id: user._id }, user._id, { fields: ['name', 'profileImg', 'user_id'] });

		return Object.assign(user, channel);
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
