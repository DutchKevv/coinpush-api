import {join} from 'path';
import {Types, ObjectId} from 'mongoose';
import {User} from '../schemas/user';
import {USER_FETCH_TYPE_PROFILE, USER_FETCH_TYPE_PROFILE_SETTINGS, USER_FETCH_TYPE_SLIM} from '../../../shared/constants/constants';

const config = require('../../../tradejs.config');

export const userController = {

	async create(params) {

		let userData = {
			email: params.email,
			username: params.username,
			password: params.password,
			passwordConf: params.passwordConf,
			country: params.country
		};

		if (!userData.email || !userData.username || !userData.password || !userData.passwordConf)
			throw 'Missing attributes';

		// use schema.create to insert data into the db
		return User.create(userData);
	},

	getAllowedFields: ['_id', 'username', 'profileImg', 'country', 'followers', 'following', 'membershipStartDate', 'description'],

	async get(userId, type = USER_FETCH_TYPE_SLIM) {

		let fields = this.getAllowedFields.filter(field => this.getAllowedFields.includes(field));

		switch (type) {
			case USER_FETCH_TYPE_SLIM:
				fields = ['username', 'profileImg', 'country'];
				break;
			case USER_FETCH_TYPE_PROFILE:

				break;
			case USER_FETCH_TYPE_PROFILE_SETTINGS:
				fields = ['username', 'profileImg', 'country', 'email', 'description'];
				break;
		}

		this.getAllowedFields.forEach(field => fields[field] = 1);

		return User.aggregate([
			{
				$match: {
					_id: Types.ObjectId(userId)
				}
			},
			{
				$project: {
					followersCount: {$size: {'$ifNull': ['$followers', []]}},
					followingCount: {$size: {'$ifNull': ['$following', []]}},
					...fields
				}
			},
			{
				$limit: 1
			}
		]).then(users => {
			const user = users[0];

			if (!user)
				return null;

			user.profileImg = User.normalizeProfileImg(user.profileImg);

			return user;
		});
	},

	async getProfile(userId, isSelf = false) {

	},

	async getMany (params, reqUserId) {
		const limit = params.limit || 20;
		const sort = params.sort || -1;

		// Filter allowed fields
		const fields = {};
		(params.fields || this.getAllowedFields).filter(field => this.getAllowedFields.includes(field)).forEach(field => fields[field] = 1);

		const usersQuery = User.aggregate([
			{
				$project: {
					followersCount: {$size: {'$ifNull': ['$followers', []]}},
					followingCount: {$size: {'$ifNull': ['$following', []]}},
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

		const data = await Promise.all([usersQuery, User.findById(reqUserId)]);
		const following = data[1].following;

		data[0].forEach(user => {
			user.profileImg = User.normalizeProfileImg(user.profileImg);
			user.follow = following.indexOf(user._id) > -1;
		});

		return data[0];
	},

	// TODO - Filter fields
	async update(userId, params) {
		return User.update({_id: Types.ObjectId(userId)}, {...params})
	}
};