import * as faker from 'faker';
import * as minimist from 'minimist';
import { userController } from '../controllers/user.controller';
import { emailController } from '../controllers/email.controller';
import { USER_FETCH_TYPE_PROFILE_SETTINGS } from '../../../shared/constants/constants';

const argv = minimist(process.argv.slice(2));

module.exports = {

	async addFakeUsers(count: number = 20) {
		let i = count;

		while (i--) {

			try {
				let password = faker.internet.password();

				const user = await userController.create({ id: null }, {
					_id: undefined,
					name: faker.name.findName(),
					email: faker.internet.email(),
					country: faker.address.countryCode(),
					password: password,
					img: faker.image.avatar(),
					description: faker.lorem.sentence()
				});

				console.log(i, 'user-id:', user);

			} catch (error) {
				console.error('USER ERROR', error);
			}
		}

		process.exit();
	},

	async checkUser(id: string) {
		const user = await userController.findById({ id }, id);

		if (user) {
			console.log('USER OK');
			process.exit(0);
		} else {
			console.log('USER NOT OK');
			process.exit(1);
		}
	},

	async syncUser(id: string) {
		const user = await userController.findById({ id }, id, {type: USER_FETCH_TYPE_PROFILE_SETTINGS});

		if (!user || !user._id)
			throw new Error('User not found in main tradejs-user collection');

		try {
			await emailController.addUser({id}, user, true);
		} catch (error) {
			console.log('EMAIL');
			console.error(error.message);
		}
	},

	async removeUser(id: string) {
		await userController.remove({ id }, id);

		process.exit();
	},

	async addFakeFollowersAndCopiers(min = 0, max = 10) {

	}
};

if (argv['remove-user']) {
	module.exports.removeUser(argv['remove-user']).catch(console.error);
}

if (argv['check-user']) {
	module.exports.checkUser(argv['check-user']).catch(console.error);
}

if (argv['sync-user']) {
	module.exports.syncUser(argv['sync-user']).catch(console.error);
}

if (argv['add-fake-users']) {
	module.exports.addFakeUsers(argv['add-fake-users']).catch(console.error);
}

// module.exports.addFakeUsers(5).then(() => process.exit(0)).catch(console.error);