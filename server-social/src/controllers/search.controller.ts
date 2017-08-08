import {User} from '../schemas/user';

export const searchController = {

	search(text: string) {

		const regex = new RegExp('.*' + text + '.*', 'i');

		return User.find({username: regex}, {_id: 1, username: 1, profileImg: 1, counter: 1, followersCount: 1});
	}
};