import { Schema, model, Types } from 'mongoose';
import { join } from 'path';
import { isEmail } from 'validator';
import { CHANNEL_TYPE_MAIN } from '../../../shared/constants/constants';

const config = require('../../../tradejs.config');

export const ChannelSchema = new Schema({
	user_id: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'User'
	},
	name: {
		type: String,
		required: true,
		unique: true
	},
	profileImg: {
		type: String,
		default: ''
	},
	coverImg: {
		type: String,
		default: ''
	},
	description: {
		type: String,
		default: ''
	},
	transactions: {
		type: Number,
		default: 0
	},
	orders: {
		type: [Schema.Types.ObjectId],
		default: []
	},
	points: {
		type: Array,
		default: []
	},
	pips: {
		type: Number,
		default: 0
	},
	followers: [{
		type: Schema.ObjectId,
		default: [],
		ref: 'User'
	}],
	followersCount: {
		type: Number,
		default: 0
	},
	copiers: [{
		type: Schema.ObjectId,
		default: [],
		ref: 'User'
	}],
	copiersCount: {
		type: Number,
		default: 0
	},
	visitors: [{
		type: Schema.ObjectId,
		default: [],
		ref: 'User'
	}],
	public: {
		type: Boolean,
		default: true
	},
	type: {
		type: Number,
		default: CHANNEL_TYPE_MAIN
	},
	created: {
		type: Date,
		default: Date.now
	}
});

ChannelSchema.statics.normalize = function (user, doc) {
	if (!doc)
		return;

	Channel.normalizeProfileImg(doc);
	Channel.setICopy(user, doc);
	Channel.setIFollow(user, doc);
	return doc
};

ChannelSchema.statics.setICopy = function (user, doc) {
	if (doc.followers)
		doc.iFollow = doc.followers.map(f => f.toString()).indexOf(user.id) > -1;

	return this;
};

ChannelSchema.statics.setIFollow = function (user, doc) {
	if (doc.copiers)
		doc.iCopy = doc.copiers.map(c => c.toString()).indexOf(user.id) > -1;

	return this;
};

/**
 * Transform image filename to full url
 * @param filename
 * @returns {any}
 */
ChannelSchema.statics.normalizeProfileImg = function (doc) {
	console.log('doc doc doc doc', doc);

	// copiers
	if (doc.copiers && doc.copiers.length)
		doc.copiers.forEach(copier => ChannelSchema.statics.normalizeProfileImg(copier));

	// followers
	if (doc.followers && doc.followers.length)
		doc.followers.forEach(follower => ChannelSchema.statics.normalizeProfileImg(follower));

	// default img
	if (!doc.profileImg) {
		if (doc.type === CHANNEL_TYPE_MAIN)
			doc.profileImg = config.image.profileDefaultUrl;
		else
			doc.profileImg = config.image.channelDefaultUrl;

		return;
	}

	// external image
	if (doc.profileImg.startsWith('/') || doc.profileImg.startsWith('http://') || doc.profileImg.startsWith('https://'))
		return;

	// user image
	if (doc.type === CHANNEL_TYPE_MAIN)
		doc.profileImg = join(config.image.profileBaseUrl, doc.profileImg);

	// channel image
	else
		doc.profileImg = join(config.image.channelBaseUrl, doc.profileImg);
};

export const Channel = model('Channel', ChannelSchema);