import {Schema, model} from 'mongoose';

export const CandleSchema = new Schema({
	time: {
		type: Date,
		lowercase: true,
		default: Date.now
	},
	data: {
		type: Buffer,
		required: true
	}
});

export const Candle = model('Candle', CandleSchema);