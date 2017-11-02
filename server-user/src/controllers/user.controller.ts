import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { client } from '../modules/redis';
import { User } from '../schemas/user';
import {
	G_ERROR_EXPIRED,
	G_ERROR_USER_NOT_FOUND,
	REDIS_USER_PREFIX, USER_FETCH_TYPE_ACCOUNT_DETAILS, USER_FETCH_TYPE_PROFILE_SETTINGS, USER_FETCH_TYPE_SLIM,
} from '../../../shared/constants/constants';
import { IReqUser } from "../../../shared/interfaces/IReqUser.interface";
import { IUser } from "../../../shared/interfaces/IUser.interface";

const RESET_PASSWORD_TOKEN_EXPIRE = 1000 * 60 * 60 * 24; // 24 hour

export const userController = {

	getAllowedFields: ['_id', 'username', 'profileImg', 'country', 'followers', 'following', 'membershipStartDate', 'description', 'balance'],

	async find(reqUser, userId, type: number = USER_FETCH_TYPE_SLIM, fields: Array<string> = ['_id']) {
		if (!userId)
			throw new Error('user id is required');

		let REDIS_KEY = REDIS_USER_PREFIX + userId;
		let fieldsArr = [];
		let user;

		switch (type) {
			case USER_FETCH_TYPE_ACCOUNT_DETAILS:
				fieldsArr = ['country', 'balance', 'leverage'];
				break;
			case USER_FETCH_TYPE_PROFILE_SETTINGS:
				fieldsArr = ['country', 'leverage', 'gender'];
				break;
			case USER_FETCH_TYPE_SLIM:
			default:
				fieldsArr = fields;
				break;
		}

		if (!user) {
			let fieldsObj = {};
			fieldsArr.forEach(field => fieldsObj[field] = 1);

			user = await User.findById(userId, fieldsObj);
		}

		return user;
	},

	async findMany(reqUser, params) {
		const limit = params.limit || 20;
		const sort = params.sort || -1;

		// Filter allowed fields
		const fields = {};
		(params.fields || this.getAllowedFields).filter(field => this.getAllowedFields.includes(field)).forEach(field => fields[field] = 1);

		const where: any = {};
		if (params.email)
			where.email = params.email;

		return User.find(where, fields).sort({ _id: sort }).limit(limit);
	},

	async findByEmail(reqUser, email: string, fields: Array<string> = []) {
		let fieldsObj = {};
		fields.forEach(field => fieldsObj[field] = 1);

		return User.findOne({ email }, fields);
	},

	async create(params) {
		if (params.password)
			params.password = bcrypt.hashSync(params.password, 10);

		let userData = {
			email: params.email,
			name: params.name,
			password: params.password,
			country: params.country
		};

		return User.create(userData);
	},

	async getCached(key) {
		return new Promise((resolve, reject) => {
			client.get(key, function (err, reply) {
				if (err)
					reject(err);
				else
					resolve(JSON.parse(reply))
			});
		});
	},

	// TODO - Filter fields
	async update(reqUser, userId, params): Promise<void> {
		if (params.password) {
			// await this.updatePassword(reqUser, undefined, params.password);
			delete params.password;
		}

		const user = await User.findByIdAndUpdate(userId, params);

		if (!user)
			throw ({ code: G_ERROR_USER_NOT_FOUND, user: userId });

		// Update redis and other micro services
		if (user)
			client.publish('user-updated', JSON.stringify(user));
	},

	// TODO - Filter fields
	async updatePassword(reqUser: IReqUser, token, password): Promise<void> {
		let user;

		if (token)
			user = await User.findOne({ resetPasswordToken: token }, { resetPasswordExpires: 1 });
		else if (reqUser.id)
			user = await User.findById(reqUser.id);

		// Update redis and other micro services
		if (!user)
			throw ({ code: G_ERROR_USER_NOT_FOUND });

		if (token && user.resetPasswordExpires < new Date())
			throw ({ code: G_ERROR_EXPIRED });

		user.password = bcrypt.hashSync(password, 10);
		user.resetPasswordToken = undefined;
		user.resetPasswordExpires = undefined;

		await user.save();
	},

	async requestPasswordReset(reqUser, email: string): Promise<{ _id: string, resetPasswordToken: string, resetPasswordExpires: number, name: string }> {
		const token = bcrypt.genSaltSync(10);
		const expires = Date.now() + RESET_PASSWORD_TOKEN_EXPIRE;

		const user = <IUser>await User.findOneAndUpdate({ email }, { resetPasswordToken: token, resetPasswordExpires: expires }, { fields: { _id: 1, name: 1 } }).lean();

		if (!user)
			throw ({ code: G_ERROR_USER_NOT_FOUND });

		return { _id: user._id, resetPasswordToken: token, resetPasswordExpires: expires, name: user.name };
	},

	async remove(reqUser, id): Promise<any> {
		console.log('DELETE!!');
		if (reqUser.id !== id)
			throw({code: '???', message: 'Remove user - req.user.id and userId to not match'});

		const user = await User.findByIdAndRemove(id).lean();

		console.log('REMOVE USER', user);

		return user;
	}
};