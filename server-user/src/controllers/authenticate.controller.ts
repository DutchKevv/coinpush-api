import * as jwt from 'jsonwebtoken';
import mongoose = require('mongoose');
import {User} from '../schemas/user.schema';
import {IUser} from "../../../shared/interfaces/IUser.interface";

const config = require('../../../tradejs.config');

export const authenticateController = {

	async authenticate(reqUser, params: { email?: string, password?: string}, fields = []): Promise<any> {
		let user;

		let fieldsObj = {};
		fields.forEach(field => fieldsObj[field] = 1);
		console.log(reqUser);
		if (reqUser.id)
			user = <IUser>await (<any>User).findById(reqUser.id, fieldsObj).lean();
		else
			user = <IUser>await (<any>User).authenticate(params, fields);

		if (user) {
			user.token = jwt.sign({id: user._id}, config.token.secret);
			(<any>User).normalizeProfileImg(user);			
		}
		
		return user;
	}
};