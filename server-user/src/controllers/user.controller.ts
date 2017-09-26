import {Types, ObjectId} from 'mongoose';
import {client} from '../modules/redis';
import {User} from '../schemas/user';
import {
	REDIS_USER_PREFIX, USER_FETCH_TYPE_ACCOUNT_DETAILS, USER_FETCH_TYPE_PROFILE_SETTINGS, USER_FETCH_TYPE_SLIM,
} from '../../../shared/constants/constants';

export const userController = {

	getAllowedFields: ['_id', 'username', 'profileImg', 'country', 'followers', 'following', 'membershipStartDate', 'description', 'balance'],

	async find(reqUser, userId, type: number = USER_FETCH_TYPE_SLIM, forceReload = false) {
		if (!userId)
			throw new Error('user id is required');

		let REDIS_KEY = REDIS_USER_PREFIX + userId;
		let fieldsArr = [];
		let user;

		switch (type) {
			case USER_FETCH_TYPE_ACCOUNT_DETAILS:
				fieldsArr = ['country', 'balance', 'leverage'];
				break;
			case USER_FETCH_TYPE_PROFILE_SETTINGS:
				fieldsArr = ['email', 'country', 'leverage'];
				break;
			case USER_FETCH_TYPE_SLIM:
			default:
				fieldsArr = ['country'];
				break;
		}

		if (!user) {
			let fieldsObj = {};
			fieldsArr.forEach(field => fieldsObj[field] = 1);

			user = (await User.aggregate([
				{
					$match: {
						_id: Types.ObjectId(userId)
					}
				},
				{
					$project: {
						...fieldsObj
					}
				},
				{
					$limit: 1
				}
			]))[0];

		}

		if (user) {
			Object.keys(user)
				.filter(key => !fieldsArr.includes(key))
				.forEach(key => delete user[key]);
		}

		return user;
	},

	async findMany(reqUser, params) {
		const limit = params.limit || 20;
		const sort = params.sort || -1;

		// Filter allowed fields
		const fields = {};
		(params.fields || this.getAllowedFields).filter(field => this.getAllowedFields.includes(field)).forEach(field => fields[field] = 1);

		const data = await User.aggregate([
			{
				$project: {
					...fields
				}
			},
			{
				$limit: limit
			},
			{
				$sort: {
					_id: sort
				}
			}
		]);

		return data;
	},

	async create(params) {

		let userData = {
			email: params.email,
			password: params.password,
			country: params.country
		};

		if (!userData.email || !userData.password)
			throw 'Missing attributes';

		return User.create(userData);
	},

	async getCached(key) {
		return new Promise((resolve, reject) => {
			client.get(key, function (err, reply) {
				if (err)
					reject(err);
				else
					resolve(JSON.parse(reply))
			});
		});
	},

	// TODO - Filter fields
	async update(reqUser, userId, params) {

		// Update DB
		const user = await User.findByIdAndUpdate(userId, params);

		// Update redis and other micro services
		if (user)
			client.publish('user-updated', JSON.stringify(user))
	},

	async remove(id) {

	}
};