import * as jwt from 'jsonwebtoken';
import { User } from '../schemas/user.schema';
import { IUser } from "coinpush/src/interface/IUser.interface";
import { IReqUser } from 'coinpush/src/interface/IReqUser.interface';
import { config } from 'coinpush/src/util/util-config';
import { userController } from './user.controller';

export const authenticateController = {

	async authenticate(reqUser: IReqUser, params: { email?: string, password?: string, token?: string }, fields = []): Promise<IUser> {
		let user: IUser;

		let fieldsObj = {};
		fields.forEach(field => fieldsObj[field] = 1);

		if (reqUser.id)
			user = <IUser>await (<any>User).findById(reqUser.id, fieldsObj).lean();
		else
			user = <IUser>await (<any>User).authenticate(params, fields);

		if (user && user._id) {
			user.token = jwt.sign({ id: user._id }, config.auth.jwt.secret || 'liefmeisje');
			// (<any>User).normalizeProfileImg(user);
		}

		return user;
	},

	async authenticateFacebook(reqUser: IReqUser, params: { facebookId: string }): Promise<IUser> {
		const user: IUser = (await userController.findMany(reqUser, {facebookId: params.facebookId}))[0];

		if (user && user._id) {
			user.token = jwt.sign({ id: user._id }, config.auth.jwt.secret || 'liefmeisje');
			// (<any>User).normalizeProfileImg(user);
		}

		return user;
	}
};