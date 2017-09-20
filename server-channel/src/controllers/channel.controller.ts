import {client} from '../modules/redis';
import {Channel} from '../schemas/channel';
import * as mongoose from 'mongoose';
import {CHANNEL_TYPE_CUSTOM, CHANNEL_TYPE_MAIN} from '../../../shared/constants/constants';

const config = require('../../../tradejs.config');
const ObjectID = require('mongodb').ObjectID;

client.subscribe('user-created');

client.on('message', async (channel, message) => {
	console.log(channel + ': ' + message);

	try {
		const data = JSON.parse(message);

		switch (channel) {
			case 'user-created':
				await channelController.create(data._id, {name: 'main'});
				break;
		}
	} catch (error) {
		console.error(error);
	}
});

export const channelController = {

	async findById(reqUser: {id: string}, id: string): Promise<any> {
		const channel = await Channel.findById(id).lean();

		Channel.normalize(reqUser, channel);

		return channel;
	},

	async findByUserId(reqUser, userId: string, type?: number, fields?: any): Promise<Array<any>> {
		const opt = {user_id: userId};
		if (typeof type === 'number')
			opt['type'] = type;

		let channels = await Channel.find(opt, fields).lean();

		channels = channels.map(channel => Channel.normalize(reqUser, channel));

		return channels;
	},

	async findMany(reqUser, params: {limit?: number, sort?: number} = {}): Promise<any> {
		const limit = params.limit || 20;
		const sort = params.sort || -1;

		const results = await Channel.aggregate([
			{
				$project: {
					followersCount: {$size: '$followers'},
					copiersCount: {$size: '$copiers'},
					followers: 1,
					copiers: 1,
					user_id: 1,
					profileImg: 1,
					name: 1,
					transactions: 1,
					description: 1
				}
			},
			{
				$limit: limit
			},
			{
				$sort: {
					_id: sort
				}
			}
		]);

		const channels = results.map(channel => {
			// TODO: MOVE EMPTY PROFILEIMG URL REDIRECT TO GATEWAY API
			Channel.normalize(reqUser, channel);

			return channel;
		});

		return channels
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

	async toggleFollow(reqUser: {id: string}, channelId: string, state?: boolean): Promise<any> {
		console.log(reqUser.id, channelId, state);

		const channel = await Channel.findById(channelId);

		// Validity checks
		if (!channel)
			throw new Error('Channel not found');

		if (channel.user_id === reqUser.id)
			throw new Error('Cannot follow self managed channels');

		const isFollowing = channel.followers && channel.followers.indexOf(reqUser.id) > -1;

		if (isFollowing)
			await channel.update({$pull: {followers: reqUser.id}});
		else
			await channel.update({$addToSet: {followers: reqUser.id}});

		return {state: !isFollowing};
	},

	async toggleCopy(reqUser: {id: string}, channelId: string, state?: boolean): Promise<any> {
		console.log(reqUser.id, channelId, state);

		const channel = await Channel.findById(channelId);

		// Validity checks
		if (!channel)
			throw new Error('Channel not found');

		if (channel.user_id.toString() === reqUser.id)
			throw new Error('Cannot copy self managed channels');

		const isCopying = channel.copiers && channel.copiers.indexOf(reqUser.id) > -1;
		console.log('isCopying isCopying isCopying isCopying', isCopying, channel);
		if (isCopying)
			await channel.update({$pull: {copiers: ObjectID(reqUser.id)}});
		else
			await channel.update({$addToSet: {copiers: ObjectID(reqUser.id)}});

		return {state: !isCopying};
	},

	delete(userId: string, id: string): Promise<any> {
		return Channel.deleteOne({_id: mongoose.Types.ObjectId(id), user_id: mongoose.Types.ObjectId(userId)});
	}
};