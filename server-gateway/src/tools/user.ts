import * as faker from 'faker';
import {userController} from '../controllers/user.controller';

module.exports = {

	async addFakeUsers(count) {
		let i = count;

		while (i--) {

			try {
				let password = faker.internet.password();

				const {user, channel} = await userController.create({id: null}, {
					username: faker.name.findName(),
					email: faker.internet.email(),
					country: faker.address.countryCode(),
					password: password,
					passwordConf: password,
					profileImg: faker.image.avatar(),
					description: faker.lorem.sentence()
				});

				console.log(i, 'user-id:', user._id, ' channel-id:', channel._id);

			} catch (error) {
				console.error('USER ERROR', error);
			}
		}

		process.exit();
	}
};

module.exports.addFakeUsers(100).then(() => process.exit(0)).catch(console.error);