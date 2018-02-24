import { Types } from 'mongoose';
import { User, UserSchema } from '../schemas/user.schema';
import {
	G_ERROR_EXPIRED,
	G_ERROR_USER_NOT_FOUND,
	REDIS_USER_PREFIX, USER_FETCH_TYPE_ACCOUNT_DETAILS, USER_FETCH_TYPE_PROFILE_SETTINGS, USER_FETCH_TYPE_SLIM,
} from 'coinpush/constant';
import { IReqUser } from "coinpush/interface/IReqUser.interface";
import { IUser } from "coinpush/interface/IUser.interface";

const RESET_PASSWORD_TOKEN_EXPIRE = 1000 * 60 * 60 * 24; // 24 hour

export const deviceController = {

	add(reqUser: IReqUser, options: any): Promise<void> {
		return (<any>User).addDevice(reqUser.id, options);
	},

	remove(reqUser: IReqUser, token: string): Promise<void> {
		return (<any>User).removeDevice(reqUser.id, token);
	}
};