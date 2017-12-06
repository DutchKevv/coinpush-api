import { Types } from 'mongoose';
import { User } from '../schemas/user.schema';
import {
	G_ERROR_EXPIRED,
	G_ERROR_USER_NOT_FOUND,
	REDIS_USER_PREFIX, USER_FETCH_TYPE_ACCOUNT_DETAILS, USER_FETCH_TYPE_PROFILE_SETTINGS, USER_FETCH_TYPE_SLIM,
} from '../../../shared/constants/constants';
import { IReqUser } from "../../../shared/interfaces/IReqUser.interface";
import { IUser } from "../../../shared/interfaces/IUser.interface";

const RESET_PASSWORD_TOKEN_EXPIRE = 1000 * 60 * 60 * 24; // 24 hour

export const userController = {

	async find(reqUser, userId, options: any = {}) {
		const user = await User.find({ userId })

		return user;
	},

	findById(reqUser, userId) {
		return User.findById(userId);
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

	async create(reqUser, params, options) {
		console.log('emaila sdf', params);
		return User.findOneAndUpdate({_id: params._id}, params, {upsert: true, new: true, setDefaultsOnInsert: true});
	},

	// TODO - Filter fields
	async update(reqUser, userId, params): Promise<void> {
		console.log(params);
		if (params.device) {
			if (params.device.token)
				await (<any>User).addDevice(userId, params.device);
			delete params.device;
		}

		const user = await User.findByIdAndUpdate(userId, params);

		if (!user)
			throw ({ code: G_ERROR_USER_NOT_FOUND });
	},

	remove(reqUser: IReqUser, userId: string) {
		return User.findByIdAndRemove(userId);
	}
};