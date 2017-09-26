import {Types, ObjectId} from 'mongoose';
import {client} from '../modules/redis';
import {User} from '../schemas/user';
import {
	REDIS_USER_PREFIX, USER_FETCH_TYPE_ACCOUNT_DETAILS,
	USER_FETCH_TYPE_BROKER_DETAILS, USER_FETCH_TYPE_PROFILE, USER_FETCH_TYPE_PROFILE_SETTINGS, USER_FETCH_TYPE_SLIM,
} from '../../../shared/constants/constants';

export const walletController = {

	async updateBalance(reqUser, walletId, params: { amount: number }): Promise<{balance: number}> {

		const user = await User.findByIdAndUpdate(Types.ObjectId(reqUser.id), {$inc: {balance: params.amount}});

		if (user)
			return {balance: user.balance};

		throw `User ${reqUser.id} not found`;
	}
};