import * as jwt from 'jsonwebtoken';
import mongoose = require('mongoose');
import {User} from '../schemas/user.schema';
import {IUser} from "coinpush/interface/IUser.interface";
import { IReqUser } from 'coinpush/interface/IReqUser.interface';

const config = require('../../../coinpush.config.js');

export const authenticateController = {

	async authenticate(reqUser: IReqUser, params: { email?: string, password?: string, token?: string}, fields = []): Promise<any> {
		let user;

		let fieldsObj = {};
		fields.forEach(field => fieldsObj[field] = 1);
		
		if (reqUser.id)
			user = <IUser>await (<any>User).findById(reqUser.id, fieldsObj).lean();
		else
			user = <IUser>await (<any>User).authenticate(params, fields);

		if (user && user._id) {
			user.token = jwt.sign({id: user._id}, config.auth.jwt.secret);
			(<any>User).normalizeProfileImg(user);
				
		}
		
		return user;
	}
};