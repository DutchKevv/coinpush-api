import {Types, ObjectId} from 'mongoose';
import {User} from '../schemas/user';

export const authenticateController = {

	login(email: string, password: string, token?: string) {
		if (!email || !password)
			return false;

		return User.authenticate(email, password, token);
	}
};