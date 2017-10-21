import * as jwt from 'jsonwebtoken';
import {Types, ObjectId} from 'mongoose';
import {User} from '../schemas/user';

const config = require('../../../tradejs.config');

export const authenticateController = {

	async authenticate(reqUser, params: { email?: string, password?: string}, fields = []): Promise<any> {
		let user;

		let fieldsObj = {};
		fields.forEach(field => fieldsObj[field] = 1);

		if (reqUser.id)
			user = await User.findById(reqUser.id, fieldsObj).lean();
		else
			user = await User.authenticate(params);

		if (user)
			user.token = jwt.sign({id: user._id}, config.token.secret);

		console.log('user user user', user);

		return user;
	}
};