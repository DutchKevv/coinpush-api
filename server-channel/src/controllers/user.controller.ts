import { Types } from 'mongoose';
import { User } from '../schemas/user.schema';
import {
	G_ERROR_EXPIRED,
	G_ERROR_USER_NOT_FOUND,
	REDIS_USER_PREFIX, USER_FETCH_TYPE_ACCOUNT_DETAILS, USER_FETCH_TYPE_PROFILE_SETTINGS, USER_FETCH_TYPE_SLIM, CHANNEL_TYPE_MAIN
} from '../../../shared/constants/constants';
import { IReqUser } from "../../../shared/interfaces/IReqUser.interface";
import { IUser } from "../../../shared/interfaces/IUser.interface";
import { channelController } from './channel.controller';

const RESET_PASSWORD_TOKEN_EXPIRE = 1000 * 60 * 60 * 24; // 24 hour

export const userController = {

	async find(reqUser, userId) {
		let user;

		return User.find({ userId })
	},

	findById(reqUser, id) {
		return User.findById(id);
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
		return User.findOne({ email });
	},

	async create(reqUser, params, options: any = {}): Promise<void> {
		let user;
		
		console.log('bitch ', params);

		const results = await Promise.all([
			User.findOneAndUpdate({_id: params._id}, params, {upsert: true, new: true, setDefaultsOnInsert: true}),
			channelController.create(reqUser, Object.assign(params, {_id: undefined, user_id: params._id}), CHANNEL_TYPE_MAIN, options)
		]);
	},

	// TODO - Filter fields
	async update(reqUser, userId, params): Promise<void> {
		const user = await Promise.all([
			User.findByIdAndUpdate(userId, params),
			channelController.updateByUserId(reqUser, userId, params)
		]);
		
		if (!user[0])
			throw ({ code: G_ERROR_USER_NOT_FOUND });
	},

	async remove(reqUser: IReqUser, userId: string): Promise<IUser> {
		await channelController.removeByUserId(reqUser, userId);
		
		return User.findByIdAndRemove(userId);
	}
};