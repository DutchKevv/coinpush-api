import {Types, ObjectId} from 'mongoose';
import {client} from '../modules/redis';
import {User} from '../schemas/user';

export const walletController = {

	async updateBalance(reqUser, walletId, params: { amount: number }): Promise<{balance: number}> {

		const user = await User.findByIdAndUpdate(Types.ObjectId(reqUser.id), {$inc: {balance: params.amount}});

		if (user)
			return {balance: user.balance};

		throw `User ${reqUser.id} not found`;
	}
};