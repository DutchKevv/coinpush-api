import * as request from 'request-promise';
import {channelController} from './channel.controller';

const config = require('../../../tradejs.config');

export const authenticateController = {

	async authenticate(reqUser, params: {email?: string, password?: string, token?: string}): Promise<any> {

		params['fields'] = ['balance', 'leverage', 'favorites'];

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

		const channel = await channelController.findByUserId({id: user._id}, user._id, ['name', 'profileImg']);

		return Object.assign(user, channel);
	}
};
