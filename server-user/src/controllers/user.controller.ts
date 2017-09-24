import {Types, ObjectId} from 'mongoose';
import {client} from '../modules/redis';
import {User} from '../schemas/user';
import {
	REDIS_USER_PREFIX, USER_FETCH_TYPE_ACCOUNT_DETAILS,
	USER_FETCH_TYPE_BROKER_DETAILS, USER_FETCH_TYPE_PROFILE, USER_FETCH_TYPE_PROFILE_SETTINGS, USER_FETCH_TYPE_SLIM,
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
				fieldsArr = ['country', 'balance'];
				break;
			case USER_FETCH_TYPE_BROKER_DETAILS:
				fieldsArr = ['brokerToken', 'brokerAccountId'];
				break;
			case USER_FETCH_TYPE_PROFILE_SETTINGS:
				return this.getProfileSettings(userId);
			case USER_FETCH_TYPE_PROFILE:
				fieldsArr  = [''];
				break;
			case USER_FETCH_TYPE_SLIM:
			default:
				fieldsArr = ['username', 'profileImg', 'country', 'description'];
				break;
		}

		if (![USER_FETCH_TYPE_ACCOUNT_DETAILS, USER_FETCH_TYPE_BROKER_DETAILS].includes(type) && !forceReload)
			user = await this.getCached(REDIS_KEY);

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

			if (user) {
				user.profileImg = User.normalizeProfileImg(user.profileImg);

				client.set(REDIS_KEY, JSON.stringify(user), function () {
					// Why wait?
				});
			}
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

		data.forEach(user => user.profileImg = User.normalizeProfileImg(user.profileImg));

		return data;
	},

	async create(params) {

		let userData = {
			email: params.email,
			username: params.username,
			password: params.password,
			passwordConf: params.passwordConf,
			profileImg: params.profileImg,
			description: params.description,
			country: params.country
		};

		if (!userData.email || !userData.username || !userData.password || !userData.passwordConf)
			throw 'Missing attributes';

		// use schema.create to insert data into the db
		const user = await User.create(userData);

		client.publish('user-created', JSON.stringify({
			_id: user._id,
			username: user.username
		}), (error) => {
			if (error)
				console.log('REDIS ERROR: ', error);
		});

		return user;
	},

	async getProfileSettings(userId) {
		const user = await User.findById(userId, {
			username: 1,
			email: 1,
			profileImg: 1,
			country: 1,
			brokerToken: 1,
			brokerAccountId: 1,
			description: 1
		});

		user.profileImg = User.normalizeProfileImg(user.profileImg);

		return user;
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
		const user = await User.findByIdAndUpdate(userId, params, {upsert: true});

		// Update redis and other micro services
		if (user)
			client.publish('user-updated', JSON.stringify(user))
	},

	async remove(id) {

	}
};