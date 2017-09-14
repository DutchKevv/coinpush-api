import {client} from '../modules/redis';
import {Channel} from '../schemas/channel';
import {Types} from 'mongoose';
import {CHANNEL_TYPE_CUSTOM, CHANNEL_TYPE_MAIN} from '../../../shared/constants/constants';

const config = require('../../../tradejs.config');

client.subscribe('user-created');
client.subscribe('order-created');

client.on('message', async (channel, message) => {
	console.log(channel + ': ' + message);

	try {
		const data = JSON.parse(message);

		switch (channel) {
			case 'user-created':
				await channelController.create(data._id, {name: 'main'});
				break;
			case 'order-created':
				await channelController.copyOrder(data);
				break;
		}
	} catch (error) {
		console.error(error);
	}
});

export const channelController = {

	async findById(id): Promise<any> {
		return Channel.findById(id);
	},

	async findByUserId(id: string, type?: number, fields?: any): Promise<any> {
		const opt = {user_id: id};
		if (typeof type === 'number')
			opt['type'] = type;

		return await Channel.find(opt, fields);
	},

	create(userId, options, type = CHANNEL_TYPE_CUSTOM): Promise<any> {
		return Channel.create({
			user_id: userId,
			name: options.name,
			description: options.description,
			public: options.public,
			type
		});
	},

	update(userId, id, options): Promise<any> {
		return Promise.reject('TODO');
	},

	async toggleFollow(followerId: string, channelId: string, state?: boolean): Promise<any> {
		console.log(followerId, channelId, state);

		const channel = await this.findById(channelId);
		// Validity checks
		if (!channel)
			throw new Error('Channel not found');

		console.log(channel.user_id);

		if (channel.user_id === followerId)
			throw new Error('Cannot follow self managed channels');

		const isFollowing = channel.followers.indexOf(followerId) > -1;

		if (isFollowing) {
			await Channel.update({_id: channelId}, {$pull: {followers: Types.ObjectId(followerId)}});
		} else {
			await Channel.update({_id: channelId}, {$addToSet: {followers: Types.ObjectId(followerId)}});
		}

		return {state: !isFollowing};
	},

	async toggleCopy(copierId: string, channelId: string, state?: boolean): Promise<any> {
		console.log(copierId, channelId, state);

		const channel = await this.findById(channelId);
		// Validity checks
		if (!channel)
			throw new Error('Channel not found');

		console.log(channel.user_id);

		if (channel.user_id === copierId)
			throw new Error('Cannot copy self managed channels');

		const isCopying = !!(channel && channel.copiers && channel.copiers.indexOf(copierId) > -1);

		if (isCopying) {
			await Channel.update({_id: channelId}, {$pull: {copiers: Types.ObjectId(copierId)}});
		} else {
			await Channel.update({_id: channelId}, {$addToSet: {copiers: Types.ObjectId(copierId)}});
		}

		return {state: !isCopying};
	},

	async toggleCopyByUserId(followerId: string, userId: string, state?: boolean): Promise<any> {
		const channel = await this.findByUserId(userId, CHANNEL_TYPE_MAIN, {_id: 1})[0];

		if (channel)
			return this.toggleCopyByChannelId(followerId, channel._id, state);
		else
			throw new Error('Channel not found');
	},

	async copyOrder(order) {
		console.log('ORDER ORDER ORDER', order);

		const channels = await this.findByUserId(order.user, CHANNEL_TYPE_MAIN);

		console.log('CHANNEL!', channels);

		if (!channels.length)
			throw new Error('Copy Order - Channel could not be found!');

		channels.forEach(channel => {
			channel.followers.forEach(userId => {
				console.log('follower user id: ', userId);
			});
		});
	},

	delete(userId: string, id: string): Promise<any> {
		return Channel.deleteOne({_id: Types.ObjectId(id), user_id: Types.ObjectId(userId)});
	}
};