import {Schema, model} from 'mongoose';
import {isEmail} from 'validator';

const OrderSchema = new Schema({
	b_id: {
		type: String,
		required: true
	},
	openTime: {
		type: Date,
		lowercase: true,
		default: Date.now
	},
	closeTime: {
		type: Date,
		lowercase: true
	},
	openAsk: {
		type: Number,
		lowercase: true,
		required: false
	},
	openBid: {
		type: Number,
		lowercase: true,
		required: false
	},
	openPrice: {
		type: Number,
		lowercase: true,
		required: false
	},
	closePrice: {
		type: Number,
		lowercase: true
	},
	profit: {
		type: Number
	},
	user: {
		type: Schema.Types.ObjectId,
		required: true
	},
	channel: {
		type: Schema.Types.ObjectId,
		required: false
	},
	side: {
		type: Number,
		required: true
	},
	type: {
		type: Number,
		required: true
	},
	amount: {
		type: Number,
		required: true
	},
	symbol: {
		type: String,
		required: true
	},
	stopLoss: {
		type: Number
	},
	takeProfit: {
		type: Number
	},
	magic: {
		type: Number
	},
});

// authenticate input against database
OrderSchema.statics.follow = function (from, to, callback) {

	Order.update(
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
OrderSchema.statics.unFollow = function (from, to, callback) {

	Order.update(
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

export const Order = model('Order', OrderSchema);