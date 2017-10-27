import * as jwt from 'jsonwebtoken';
import mongoose = require('mongoose');
import {User} from '../schemas/user';
import {IUser} from "../../../shared/interfaces/IUser.interface";

const config = require('../../../tradejs.config');

export const authenticateController = {

	async authenticate(reqUser, params: { email?: string, password?: string}, fields = []): Promise<any> {
		let user;

		let fieldsObj = {};
		fields.forEach(field => fieldsObj[field] = 1);

		if (reqUser.id)
			user = <IUser>await (<any>User).findById(reqUser.id, fieldsObj).lean();
		else
			user = <IUser>await (<any>User).authenticate(params);

		if (user)
			user.token = jwt.sign({id: user._id, cid: user.c_id}, config.token.secret);

		return user;
	}
};