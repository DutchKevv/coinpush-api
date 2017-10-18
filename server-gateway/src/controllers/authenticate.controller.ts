import * as request from 'request-promise';
import {channelController} from './channel.controller';

const config = require('../../../tradejs.config');

export const authenticateController = {

	async login(reqUser, email: string, password: string, token?) {

		const user = await request({
			uri: config.server.user.apiUrl + '/authenticate',
			method: 'POST',
			body: {email, password, token},
			json: true
		});

		reqUser.id = user._id;

		const channel = await channelController.findByUserId(reqUser, user._id);

		return Object.assign(user, channel);
	}
};
