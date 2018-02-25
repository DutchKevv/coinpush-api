import * as bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { pubClient } from 'coinpush/redis';
import { User, UserSchema } from '../schemas/user.schema';
import {
	G_ERROR_EXPIRED,
	G_ERROR_USER_NOT_FOUND,
	REDIS_USER_PREFIX, USER_FETCH_TYPE_ACCOUNT_DETAILS, USER_FETCH_TYPE_PROFILE_SETTINGS, USER_FETCH_TYPE_SLIM,
} from 'coinpush/constant';
import { IReqUser } from "coinpush/interface/IReqUser.interface";
import { IUser } from "coinpush/interface/IUser.interface";

const RESET_PASSWORD_TOKEN_EXPIRE = 1000 * 60 * 60 * 24; // 24 hour

export const userController = {

	getAllowedFields: ['_id', 'name', 'img', 'description', 'country', 'followers', 'following', 'followersCount', 'membershipStartDate', 'description', 'balance'],

	async findById(reqUser, userId, type: number = USER_FETCH_TYPE_SLIM, fields: Array<string> = ['_id', 'name', 'img', 'followers', 'followersCount']) {
		if (!userId)
			throw new Error('userId is required');

		let REDIS_KEY = REDIS_USER_PREFIX + userId;
		let fieldsArr = [];
		let user;

		switch (type) {
			case USER_FETCH_TYPE_ACCOUNT_DETAILS:
				fieldsArr = ['name', 'country', 'balance', 'leverage'];
				break;
			case USER_FETCH_TYPE_PROFILE_SETTINGS:
				fieldsArr = ['country', 'leverage', 'gender', 'description'];
				break;
			case USER_FETCH_TYPE_SLIM:
			default:
				fieldsArr = fields;
				break;
		}

		let fieldsObj = {};
		fieldsArr.forEach(field => fieldsObj[field] = 1);
		user = await User.findById(userId, fieldsObj).lean();

		if (user) {
			UserSchema.statics.normalize(reqUser, user);
		}

		return user;
	},

	async findMany(reqUser, params) {
		const limit = parseInt(params.limit, 10) || 20;
		const sort = params.sort || -1;

		// Filter allowed fields
		const fields: any = {};
		(params.fields || this.getAllowedFields).filter(field => this.getAllowedFields.includes(field)).forEach(field => fields[field] = 1);

		const where: any = {};
		if (params.email)
			where.email = params.email;

		if (params.text)
			where.name = { "$regex": params.text, "$options": "i" }

		if (params.facebookId)
			where['oauthFacebook.id'] = {"$eq": params.facebookId}

		console.log('where', where, params);

		fields.followers = 1;
		const users = <Array<IUser>>await User.find(where, fields).sort({ _id: sort }).limit(limit).lean();
		users.forEach((user) => {
			(<any>User).normalize(reqUser, user);
			delete user['followers'];
		});

		return users;
	},

	async findByEmail(reqUser, email: string, fields: Array<string> = []) {
		let fieldsObj = {};
		fields.forEach(field => fieldsObj[field] = 1);

		const user = await User.findOne({ email }, fields);

		if (user)
			(<any>User).normalize(reqUser, user)

		return user;
	},

	async findByText(reqUser: IReqUser, text: string): Promise<Array<IUser>> {
		const users = await User.find({ $match: { name: new RegExp('.*' + text + '.*', 'i') } });

		users.forEach(user => (<any>User).normalize(reqUser, user));

		return users;
	},

	async create(params) {

		// hash password
		// TODO - unique hash per user
		if (params.password)
			await new Promise((resolve, reject) => {
				bcrypt.hash(params.password, 10, (error, password) => {
					if (error)
						return reject(error);

					params.password = password;
					resolve();
				});
			});

		let userData: IUser = {
			img: params.img,
			email: params.email,
			name: params.name,
			password: params.password,
			country: params.country
		};

		if (params.oauthFacebook && params.oauthFacebook.id) {
			userData.confirmed = true;
			userData.oauthFacebook = {
				id: params.oauthFacebook.id
			};
		}

		const user = await User.create(userData);

		return user;
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
			pubClient.publish('user-updated', JSON.stringify(user));
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

	async toggleFollow(reqUser: { id: string }, userId: string, state?: boolean): Promise<any> {
		if (userId === reqUser.id)
			throw new Error('Cannot follow self');

		const user = await <any>User.findById(userId, { followers: 1 });

		// TODO: validity checks
		if (!user)
			throw new Error('User not found');

		const isCurrentlyFollowing = user.followers && user.followers.indexOf(reqUser.id) > -1;

		// unfollow
		if (isCurrentlyFollowing) {
			await user.update({ $pull: { followers: reqUser.id }, $inc: { followersCount: -1 } });
		}
		// follow
		else {
			await user.update({ $addToSet: { followers: reqUser.id }, $inc: { followersCount: 1 } });

			// send notification
			let pubOptions = {
				type: 'user-follow',
				toUserId: userId,
				fromUserId: reqUser.id,
				data: {}
			};

			pubClient.publish("notify", JSON.stringify(pubOptions));
		}

		return { state: !isCurrentlyFollowing };
	},

	async remove(reqUser, id): Promise<any> {
		console.log('DELETE!!');
		if (reqUser.id !== id)
			throw ({ code: '???', message: 'Remove user - req.user.id and userId to not match' });

		const user = await User.findByIdAndRemove(id).lean();

		console.log('REMOVE USER', user);

		return user;
	}
};