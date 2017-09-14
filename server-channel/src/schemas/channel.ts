import {Schema, model, Types} from 'mongoose';
import {isEmail} from 'validator';
import {CHANNEL_TYPE_MAIN} from '../../../shared/constants/constants';

export const ChannelSchema = new Schema({
	user_id: {
		type: Schema.Types.ObjectId,
		required: true
	},
	name: {
		type: String,
		required: true
	},
	profileImg: {
		type: String
	},
	description: {
		type: String
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
	copiers: {
		type: [Schema.Types.ObjectId],
		default: []
	},
	public: {
		type: Boolean,
		default: true
	},
	type: {
		type: Number,
		default: CHANNEL_TYPE_MAIN
	}
});

export const Channel = model('Channel', ChannelSchema);