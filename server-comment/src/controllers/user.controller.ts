import { Types, DocumentQuery } from 'mongoose';
import { User } from '../schemas/user.schema';
import {
	G_ERROR_EXPIRED,
	G_ERROR_USER_NOT_FOUND,
	REDIS_USER_PREFIX, USER_FETCH_TYPE_ACCOUNT_DETAILS, USER_FETCH_TYPE_PROFILE_SETTINGS, USER_FETCH_TYPE_SLIM,
} from 'coinpush/src/constant';
import { IReqUser } from "coinpush/src/interface/IReqUser.interface";
import { IUser } from "coinpush/src/interface/IUser.interface";

const RESET_PASSWORD_TOKEN_EXPIRE = 1000 * 60 * 60 * 24; // 24 hour

export const userController = {

	find(reqUser, userId, options: any = {}): DocumentQuery<any, any> {
		return User.find({ userId });
	},

	findById(reqUser, id, options: any = {}): DocumentQuery<any, any> {
		return User.findById(id);
	},

	async findMany(reqUser, params) {
		
	},

	create(reqUser, params, options): DocumentQuery<any, any> {
		return User.findOneAndUpdate({_id: params._id}, params, {upsert: true, new: true, setDefaultsOnInsert: true});
	},

	// TODO - Filter fields
	async update(reqUser, userId, params): Promise<void> {
		if (params.device) {
			await User['addDevice'](userId, params.device);
			delete params.device;
		}

		const user = await User.findByIdAndUpdate(userId, params);

		if (!user)
			throw ({ code: G_ERROR_USER_NOT_FOUND });
	},

	remove(reqUser: IReqUser, userId: string): Promise<any> {
		return this.update(reqUser, userId, {removed: true});
	}
};