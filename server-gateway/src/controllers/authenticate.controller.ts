import * as request from 'request-promise';
import * as redis from '../modules/redis';
import {CHANNEL_TYPE_MAIN, REDIS_USER_PREFIX} from '../../../shared/constants/constants';
import {channelController} from './channel.controller';

const config = require('../../../tradejs.config');

export const authenticateController = {

	async login(email: string, password: string, token?) {
		return request({
			uri: config.server.user.apiUrl + '/authenticate',
			method: 'POST',
			body: {email, password},
			json: true
		});
	}
};