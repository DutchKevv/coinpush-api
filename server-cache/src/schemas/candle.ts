import {Schema, model} from 'mongoose';

export const CandleSchema = new Schema({
	_id: {
		type: Number,
		required: true,
		index: true
	},
	data: {
		type: Schema.Types.Buffer,
		required: true
	}
});

export const Candle = model('Candle', CandleSchema);