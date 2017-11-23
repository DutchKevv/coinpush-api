import {Schema, model} from 'mongoose';

export const StatusSchema = new Schema({
	symbol: {
		type: String,
		required: true
	},
	timeFrame: {
		type: String,
		required: true
	},
	lastSync: {
		type: Date,
		required: true
	}
});

export const Status = model('Status', StatusSchema);