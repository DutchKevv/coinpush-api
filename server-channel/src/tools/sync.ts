import {client} from '../modules/redis';
import * as request from 'request';
import {channelController} from '../controllers/channel.controller';

const config = require('../../../tradejs.config');
const argv = require('minimist')(process.argv.slice(2));

module.exports = {

	async syncMainChannels() {

		while (true) {

			try {
				const userRequest = await request({
					uri: config.server.social.apiUrl,
					headers: {
						'_id': req.user.sub
					},
					json: false
				});

			} catch (error) {
				console.error(error);

				return;
			}
		}
	}
};