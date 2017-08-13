import {Schema, Types, model} from 'mongoose';
import * as bcrypt from 'bcrypt';
import {isEmail} from 'validator';
import * as jwt from 'jsonwebtoken';

const config = require('../../config');

const UserSchema = new Schema({
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
	jobTitle: {
		type: String,
		required: false,
		trim: true
	},
	description: {
		type: String,
		required: false,
		trim: false
	},
	followers: {
		type: [Schema.Types.ObjectId],
		required: false,
		default: []
	},
	following: {
		type: [Schema.Types.ObjectId],
		required: false,
		default: []
	},
	channels: {
		type: Array,
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