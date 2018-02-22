import * as jwt from 'jsonwebtoken';
import mongoose = require('mongoose');
import {User} from '../schemas/user.schema';
import {IUser} from "../../../shared/interfaces/IUser.interface";
import { IReqUser } from '../../../shared/interfaces/IReqUser.interface';

const config = require('../../../tradejs.config');

export const authenticateController = {

	async authenticate(reqUser: IReqUser, params: { email?: string, password?: string, token?: string}, fields = []): Promise<any> {
		let user;

		let fieldsObj = {};
		fields.forEach(field => fieldsObj[field] = 1);
		
		if (reqUser.id)
			user = <IUser>await (<any>User).findById(reqUser.id, fieldsObj).lean();
		else
			user = <IUser>await (<any>User).authenticate(params, fields);

			console.log(user, 'config.auth.jwt.secret config.auth.jwt.secret config.auth.jwt.secret config.auth.jwt.secret', config.auth.jwt.secret);
		if (user && user._id) {
			user.token = jwt.sign({id: user._id}, config.auth.jwt.secret);
			(<any>User).normalizeProfileImg(user);
				
		}
		
		return user;
	}
};