import {Schema, Types, model} from 'mongoose';
import * as bcrypt from 'bcrypt';
import {isEmail} from 'validator';
import {join} from 'path';
import * as jwt from 'jsonwebtoken';
import {BROKER_GENERAL_TYPE_OANDA, LEVERAGE_TYPE_1} from '../../../shared/constants/constants';

const config = require('../../../tradejs.config');

const UserSchema = new Schema({
	email: {
		type: String,
		unique: true,
		required: 'Email address is required',
		validate: [isEmail, 'invalid email'],
		lowercase: true,
		trim: true
	},
	balance: {
		type: Number,
		default: 0
	},
	leverage: {
		type: Number,
		default: LEVERAGE_TYPE_1
	},
	password: {
		type: String,
		required: true,
	},
	country: {
		type: String,
		required: false,
		trim: true,
		default: 'NL'
	},
	jobTitle: {
		type: String,
		required: false,
		trim: true
	},
	// TODO
	copying: {
		type: [Schema.Types.ObjectId],
		required: false,
		default: []
	},
	// TODO
	following: {
		type: [Schema.Types.ObjectId],
		required: false,
		default: []
	},
	transactions: {
		type: Number,
		required: false,
		default: 0
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
UserSchema.statics.authenticate = function (email, password) {

	return User.findOne({email: email}).then(user => {

		return new Promise((resolve, reject) => {

			if (!user)
				return resolve(false);

			bcrypt.compare(password, user.password, (err, result) => {
				if (err)
					return reject(err);

				if (result !== true)
					return resolve(false);

				user.profileImg = User.normalizeProfileImg(user.profileImg);

				resolve({
					_id: user._id,
					username: user.username,
					token: jwt.sign({sub: user._id}, config.token.secret)
				});
			});

		});
	});
};

UserSchema.statics.toggleFollow = async function(from, to) {
	const user = await this.findById(from, {following: 1});
	const isFollowing = !!(user && user.following && user.following.indexOf(to) > -1);

	if (isFollowing) {
		return Promise.all([
			User.update({_id: from}, {$pull: {following: Types.ObjectId(to)}}),
			User.update({_id: to}, {$pull: {followers: Types.ObjectId(from)}})
		]).then(() => ({state: !isFollowing}));
	} else {
		return Promise.all([
			User.update({_id: from}, {$addToSet: {following: Types.ObjectId(to)}}),
			User.update({_id: to}, {$addToSet: {followers: Types.ObjectId(from)}})
		]).then(() => ({state: !isFollowing}));
	}
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

export const User = model('User', UserSchema);