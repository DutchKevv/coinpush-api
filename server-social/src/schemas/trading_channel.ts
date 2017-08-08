import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

const TradingChannelSchema = new mongoose.Schema({
	email: {
		type: String,
		unique: true,
		required: true,
		trim: true
	},
	username: {
		type: String,
		unique: true,
		required: true,
		trim: true
	},
	password: {
		type: String,
		required: true,
	},
	passwordConf: {
		type: String,
		required: true,
	}
});

// hashing a password before saving it to the database
TradingChannelSchema.pre('save', function (next) {
	const user = this;
	bcrypt.hash(user.password, 10, function (err, hash) {
		if (err) {
			return next(err);
		}
		user.password = hash;
		next();
	})
});

export const TradingChannel = mongoose.model('TradingChannel', TradingChannelSchema);