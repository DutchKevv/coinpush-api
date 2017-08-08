import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import {isEmail} from 'validator';
import * as jwt from 'jsonwebtoken';

const config = require('../../config');

const UserSchema = new mongoose.Schema({
	email: {
		type: String,
		unique: true,
		required: 'Email address is required',
		validate: [isEmail, 'invalid email'],
		lowercase: true,
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
	profileImg: {
		type: String,
		required: false,
		trim: true,
		default: ''
	},
	country: {
		type: String,
		required: false,
		trim: true,
		default: 'NL'
	},
	description: {
		type: String,
		required: false,
		trim: false,
		default: 'This user has no description'
	},
	followers: {
		type: [String],
		required: false,
		default: 0
	},
	followersCount: {
		type: Number,
		required: false,
		default: 0
	},
	following: {
		type: [String],
		required: false,
		default: []
	},
	followingCount: {
		type: Number,
		required: false,
		default: 0
	},
	channels: {
		type: Array,
		required: false,
		default: []
	},
	lastOnline: {
		type: Date,
		required: false,
		default: Date.now
	},
	membershipStartDate: {
		type: Date,
		required: false,
		default: Date.now
	},
	membershipEndDate: {
		type: Date,
		required: false,
	},
	membershipType: {
		type: String,
		required: false,
		default: 'free'
	},
	active: {
		type: Boolean,
		required: false,
		default: true
	}
});

// authenticate input against database
UserSchema.statics.authenticate = function (email, password, callback) {

	User.findOne({email: email})
		.exec(function (err, user) {
			if (err) {
				return callback(err)
			} else if (!user) {
				return callback(null, null);
			}
			bcrypt.compare(password, user.password, function (_err, result) {
				if (_err)
					return callback(_err);

				if (result !== true)
					return callback(null, null);


				callback(null, {
					_id: user._id,
					username: user.username,
					firstName: user.firstName,
					lastName: user.lastName,
					token: jwt.sign({sub: user._id}, config.secret)
				});
			});
		});
};

// authenticate input against database
UserSchema.statics.follow = function (from, to, callback) {

	User.update(
		{
			_id: from,
		},
		{
			$inc: { followingCount: 1 },
			$addToSet: { following: to }
		}
	).exec(function (err) {
		console.log(err);
		if (err)
			return callback(err);

		callback(null, null);
	});
};

// authenticate input against database
UserSchema.statics.unFollow = function (from, to, callback) {

	User.update(
		{
			_id: from,
		},
		{
			$inc: { followingCount: -1 },
			$pull: { following: to }
		}
	).exec(function (err) {
		console.log(err);
		if (err)
			return callback(err);

		callback(null, null);
	});
};

// authenticate input against database
UserSchema.statics.getFollowing = function (email, password, callback) {
	User.findOne({email: email})
		.exec(function (err, user) {
			if (err) {
				return callback(err)
			} else if (!user) {
				return callback(null, null);
			}
			bcrypt.compare(password, user.password, function (_err, result) {
				if (_err)
					return callback(_err);

				if (result !== true)
					return callback(null, null);


				callback(null, {
					_id: user._id,
					username: user.username,
					firstName: user.firstName,
					lastName: user.lastName,
					token: jwt.sign({sub: user._id}, config.secret)
				});
			});
		});
};

// hashing a password before saving it to the database
UserSchema.pre('save', function (next) {
	const user = this;
	bcrypt.hash(user.password, 10, function (err, hash) {
		if (err) {
			return next(err);
		}
		user.password = hash;
		next();
	})
});

export const User = mongoose.model('User', UserSchema);