import {Schema, Types, model} from 'mongoose';
import * as bcrypt from 'bcrypt';
import {isEmail} from 'validator';
import {join} from 'path';
import {BROKER_GENERAL_TYPE_OANDA, LEVERAGE_TYPE_1} from '../../../shared/constants/constants';
import {IUser} from "../../../shared/interfaces/IUser.interface";
import * as beautifyUnique from 'mongoose-beautiful-unique-validation';

const UserSchema = new Schema({
	c_id: {
		type: Schema.Types.ObjectId,
	},
	email: {
		type: String,
		unique: true,
		required: true,
		validate: [isEmail, 'invalid email'],
		lowercase: true,
		trim: true
	},
	name: {
		type: String,
		unique: true,
		required: true,
		trim: true
	},
	gender: {
		type: Number,
		default: 0
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
	favorites: {
		type: [String],
		required: false,
		default: []
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
	},
	resetPasswordToken: {
		type: String,
	},
	resetPasswordExpires: {
		type: Date,
	},
	emailConfirmed: {
		type: Boolean,
		default: false
	}
});

// Enable beautifying on this schema 
UserSchema.plugin(beautifyUnique);

// authenticate input against database
UserSchema.statics.authenticate = async (params: IUser, fields = []) => {

	let fieldsObj = {password: 1};
	fields.forEach(field => fieldsObj[field] = 1);

	const user = <IUser>(await User.findOne({email: params.email}, {password: 1, c_id: 1, ...fieldsObj || {}}).lean());

	if (!user)
		return null;

	return new Promise((resolve, reject) => {

		bcrypt.compare(params.password, user.password, (err, result) => {
			if (err)
				return reject(err);

			if (result !== true)
				return resolve(null);

			delete user.password;
			resolve(user);
		});
	});
};

UserSchema.statics.toggleFollow = async function (from, to) {
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

UserSchema.statics.toggleFavorite = async function (userId: string, symbol: string): Promise<boolean> {
	const user = await this.findById(userId, {favorites: 1});

	if (!user)
		return;

	const isFavorite = user.favorites.includes(symbol);

	await user.update(isFavorite ? {$pull: {favorites: symbol}} : {$addToSet: {favorites: symbol}});

	return !isFavorite;
};

export const User = model('User', UserSchema);