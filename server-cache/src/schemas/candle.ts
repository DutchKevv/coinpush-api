import { Schema, model } from 'mongoose';
import { Long } from 'mongodb';

export const CandleSchema = new Schema({
	_id: {
		type: Long,
		required: true
	},
	data: {
		type: Schema.Types.Buffer,
		required: true
	}
});

export const Candle = model('Candle', CandleSchema);