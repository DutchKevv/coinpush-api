import {Schema, model} from 'mongoose';
import {isEmail} from 'validator';
import {CHANNEL_TYPE_MAIN} from '../../../shared/constants/constants';

export const ChannelSchema = new Schema({
	user_id: {
		type: String,
		lowercase: true,
		default: Date.now
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
	trades: {
		type: Number,
		default: 0
	},
	orders: {
		type: Array,
		default: []
	},
	points: {
		type: Array,
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