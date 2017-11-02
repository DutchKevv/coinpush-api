import * as jwt from 'jsonwebtoken';
import * as request from 'request-promise';
import {channelController} from './channel.controller';
import {userController} from "./user.controller";
import {G_ERROR_UNKNOWN} from "../../../shared/constants/constants";

const config = require('../../../tradejs.config');

export const authenticateController = {

	async authenticate(reqUser, params: { email?: string, password?: string, token?: string }): Promise<any> {

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

		const channel = await channelController.findByUserId({id: user._id}, user._id, {fields: ['name', 'profileImg', 'user_id']});

		return Object.assign(user, channel);
	},

	async requestPasswordReset(reqUser, email: string): Promise<void> {
		let user;

		try {
			user = await request({
				uri: config.server.user.apiUrl + '/authenticate/request-password-reset',
				headers: {'_id': reqUser.id},
				method: 'post',
				body: {email},
				json: true
			});
		} catch (error) {
			if (!error.error)
				throw({code: G_ERROR_UNKNOWN});

			return;
		}

		user.email = email;

		const result = await request({
			uri: config.server.email.apiUrl + '/mail/request-password-reset',
			headers: {'_id': reqUser.id},
			method: 'POST',
			body: {user},
			json: true
		});

		console.log('reset', result);
	}
};
