import {Schema, model, Types} from 'mongoose';
import {join} from 'path';
import {isEmail} from 'validator';
import {CHANNEL_TYPE_MAIN} from '../../../shared/constants/constants';

const config = require('../../../tradejs.config');

export const ChannelSchema = new Schema({
	user_id: {
		type: Schema.Types.ObjectId,
		required: true
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
	followers: {
		type: [Schema.Types.ObjectId],
		default: []
	},
	followersCount: {
		type: Number,
		default: 0
	},
	copiers: {
		type: [Schema.Types.ObjectId],
		default: []
	},
	copiersCount: {
		type: Number,
		default: 0
	},
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

ChannelSchema.statics.normalize = function(user, doc) {
	if (!doc)
		return;

	Channel.normalizeProfileImg(doc);
	Channel.setICopy(user, doc);
	Channel.setIFollow(user, doc);
	return doc
};

ChannelSchema.statics.setICopy = function(user, doc) {
	if (doc.followers)
		doc.iFollow = doc.followers.map(f => f.toString()).indexOf(user.id) > -1;

	return this;
};

ChannelSchema.statics.setIFollow = function(user, doc) {
	if (doc.copiers)
		doc.iCopy = doc.copiers.map(c => c.toString()).indexOf(user.id) > -1;

	return this;
};


/**
 * Transform image filename to full url
 * @param filename
 * @returns {any}
 */
ChannelSchema.statics.normalizeProfileImg = function(doc) {
	if (doc.profileImg) {
		if (doc.profileImg.indexOf('http://') > -1 || doc.profileImg.indexOf('https://') > -1)
			return;

		if (doc.type === CHANNEL_TYPE_MAIN)
			doc.profileImg = join(config.image.profileBaseUrl, doc.profileImg);
		else
			doc.profileImg = join(config.image.channelBaseUrl, doc.profileImg);
	}
	else {
		if (doc.type === CHANNEL_TYPE_MAIN)
			doc.profileImg = config.image.profileDefaultUrl;
		else
			doc.profileImg = config.image.channelDefaultUrl;
	}

	return this;
};

export const Channel = model('Channel', ChannelSchema);