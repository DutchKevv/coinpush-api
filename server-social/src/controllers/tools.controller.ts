import * as faker from 'faker';
import {User} from '../schemas/user';
import {userController} from './user.controller';


export const toolsController = {

	injectUsers(amount = 1) {

		let i = 0;

		while (i++ < amount) {

			userController.create({
				username: faker.name.findName(),
				email: faker.internet.email(),
				country: faker.address.countryCode(),
				password: faker.internet.password(),
				passwordConf: faker.internet.password(),
				profileImg: faker.random.image(),
				description: faker.lorem.sentence()
			});
		}
	},

	async updateFieldType(collection, oldFieldName, newFieldName, newFieldType) {
		const rows = await User.find({ followers: { $type : 2 }});
		console.log(rows);
		rows.forEach( function (x) {

			x.following = [];
			x.followers = [];
			x.save(x);
		});
	}
};