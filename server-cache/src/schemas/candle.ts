import {Schema, model} from 'mongoose';
import {isEmail} from 'validator';

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

// authenticate input against database
CandleSchema.statics.follow = function (from, to, callback) {

	Candle.update(
		{
			_id: from,
		},
		{
			$inc: { followingCount: 1 },
			$addToSet: { following: to }
		}
	).exec(function (err) {
		if (err)
			return callback(err);

		callback(null, null);
	});
};

// authenticate input against database
CandleSchema.statics.unFollow = function (from, to, callback) {

	Candle.update(
		{
			_id: from,
		},
		{
			$inc: { followingCount: -1 },
			$pull: { following: to }
		}
	).exec(function (err) {
		if (err)
			return callback(err);

		callback(null, null);
	});
};

export const Candle = model('Candle', CandleSchema);