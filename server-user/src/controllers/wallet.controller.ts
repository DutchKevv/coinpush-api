import {Types} from 'mongoose';
import {client} from '../modules/redis';
import {User} from '../schemas/user.schema';
import {IUser} from "../../../shared/interfaces/IUser.interface";
import {IReqUser} from "../../../shared/interfaces/IReqUser.interface";

export const walletController = {

	async updateBalance(reqUser: IReqUser, walletId: string, params: {amount: number}): Promise<{balance: number}> {

		const user = <IUser>await User.findByIdAndUpdate(Types.ObjectId(reqUser.id), {$inc: {balance: params.amount}}).lean();

		if (user)
			return {balance: user.balance};

		throw `User ${reqUser.id} not found`;
	}
};