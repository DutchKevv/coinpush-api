import {Schema, model} from 'mongoose';

export const StatusSchema = new Schema({
	symbol: {
		type: String,
		required: true
	},
	collectionName: {
		type: String,
		required: true
	},
	broker: {
		type: Number,
		required: true
	},
	timeFrame: {
		type: String,
		required: true
	},
	lastSync: {
		type: Date,
		required: true
	},
	lastPrice: {
		type: Number,
		required: true
	},
	timeFrames: {
       type: Schema.Types.Mixed
    }
});

export const Status = model('__status', StatusSchema);