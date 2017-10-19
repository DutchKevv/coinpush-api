import * as jwt from 'jsonwebtoken';
import {Types, ObjectId} from 'mongoose';
import {User} from '../schemas/user';

const config = require('../../../tradejs.config');

export const authenticateController = {

	async authenticate(reqUser, params: { email?: string, password?: string, fields?: any }): Promise<any> {
		let user;

		console.log('asfsadfasdfsadfsdf', reqUser);

		if (reqUser.id)
			user = await User.findById(reqUser.id, params.fields).lean();
		else
			user = await User.authenticate(params);

		if (user)
			user.token = jwt.sign({id: user._id}, config.token.secret);

		return user;
	}
};