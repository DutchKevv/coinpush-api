import {Types, ObjectId} from 'mongoose';
import {User} from '../schemas/user';

export const favoriteController = {

	async toggle(reqUser: {id: string}, symbol: string): Promise<{state: boolean}> {

		const state = await User.toggleFavorite(reqUser.id, symbol);

		return {state};
	}
};