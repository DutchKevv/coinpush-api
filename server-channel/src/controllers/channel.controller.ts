import {client} from '../modules/redis';
import {Channel} from '../schemas/channel';
import {CHANNEL_TYPE_MAIN} from '../../../shared/constants/constants';

const config = require('../../../tradejs.config');

client.subscribe('user-created');

client.on('message', (channel, message) => {
	const json = JSON.parse(message);

	if (channel === 'user-created') {
		channelController.create({
			user_id: json._id
		})
	}

	console.log('Message ' + message + ' on channel ' + channel + ' arrived!')
});

export const channelController = {

	async find(params: { symbol: string, timeFrame: string, from: number, until: number, count: number }) {

	},

	async findByUserId(id) {
		return Channel.findOne({user_id: id, type: CHANNEL_TYPE_MAIN});
	},

	create(params) {
		return Channel.create(params);
	}
};