import {client} from '../modules/redis';
import {Channel} from '../schemas/channel';
import {Types} from 'mongoose';
import {CHANNEL_TYPE_CUSTOM, CHANNEL_TYPE_MAIN} from '../../../shared/constants/constants';
import { IReqUser } from '../../../shared/interfaces/IReqUser.interface';

const config = require('../../../tradejs.config');

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

	_defaultFields: {
		user_id: 1,
		profileImg: 1,
		name: 1,
		transactions: 1,
		description: 1
	},

	async findById(reqUser: {id: string}, id: string): Promise<any> {
		const channel = await Channel.findById(id, this._defaultFields).lean();

		Channel.normalize(reqUser, channel);

		return channel;
	},

	async findByUserId(reqUser, userId: string, options: any = {}, type?: number): Promise<Array<any>> {
		const opt = {user_id: userId};
		let fieldsObj = this._defaultFields;

		if (typeof type === 'number')
			opt['type'] = type;

		if (options.fields)
			fieldsObj = options.fields.reduce((obj, f) => {obj[f] = 1; return obj}, {});

		let channels = await Channel.find(opt, fieldsObj).lean();

		channels = channels.map(channel => Channel.normalize(reqUser, channel));

		return channels;
	},

	async findMany(reqUser, params: {limit?: any, sort?: number, text?: string} = {}): Promise<any> {

		const aggregate = [];

		// search
		if (params.text)
			aggregate.push({$match: {name: new RegExp('.*' + params.text + '.*', 'i')}});

		// project
		aggregate.push({
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
		});

		// limit
		aggregate.push({
			$limit: parseInt(params.limit, 10) || 20
		});

		// sort
		aggregate.push({
			$sort: {
				_id: params.sort || -1
			}
		});

		const channels = await Channel.aggregate(aggregate);

		channels.map(channel => Channel.normalize(reqUser, channel));

		return channels
	},

	create(reqUser, params, type = CHANNEL_TYPE_CUSTOM, options: any = {}): Promise<any> {

		const user = Channel.findOneAndUpdate({user_id: params.user_id, type}, {
			user_id: params.user_id,
			name: params.name,
			description: params.description,
			public: params.public,
			profileImg: params.profileImg,
			type
		}, {upsert: true, new: true, setDefaultsOnInsert: true});

		return user;
	},

	update(reqUser, channelId, params): Promise<any> {
		return Channel.update({_id: Types.ObjectId(channelId), type: CHANNEL_TYPE_MAIN}, params);
	},

	updateByUserId(reqUser: {id: string}, userId: string, params): Promise<any> {
		console.log('USER USR UER SUDF SDFSDF', userId, params);
		return Channel.update({user_id: userId, type: CHANNEL_TYPE_MAIN}, params);
	},

	async toggleFollow(reqUser: {id: string}, channelId: string, state?: boolean): Promise<any> {
		console.log(reqUser.id, channelId, state);

		const channel = await Channel.findById(channelId);

		// Validity checks
		if (!channel)
			throw new Error('Channel not found');

		if (channel.user_id.toString() === reqUser.id)
			throw new Error('Cannot follow self managed channels');

		const isFollowing = channel.followers && channel.followers.indexOf(reqUser.id) > -1;

		if (isFollowing)
			await channel.update({$pull: {followers: reqUser.id}, $inc: {followersCount: -1}});
		else
			await channel.update({$addToSet: {followers: reqUser.id}, $inc: {followersCount: 1}});

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
			await channel.update({$pull: {copiers: reqUser.id}, $inc: {copiersCount: -1}});
		else
			await channel.update({$addToSet: {copiers: reqUser.id}, $inc: {copiersCount: 1}});

		return {state: !isCopying};
	},

	removeById(reqUser, id: string): Promise<any> {
		return Channel.remove({_id: id});
	},

	removeByUserId(reqUser: IReqUser, userId: string) {
		return Channel.remove({user_id: userId});
	}
};