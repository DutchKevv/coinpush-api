import * as faker from 'faker';
import {userController} from '../controllers/user.controller';
import * as mongoose from 'mongoose';

const config = require('../../../tradejs.config');

mongoose.Promise = global.Promise;
mongoose.connect(config.server.social.connectionString);

(async () => {
	let i = 0;

	while (i++ < 1000) {
		console.log('user:' , i);

		try {
			await userController.create({
				username: faker.name.findName(),
				email: faker.internet.email(),
				country: faker.address.countryCode(),
				password: faker.internet.password(),
				passwordConf: faker.internet.password(),
				profileImg: faker.random.image(),
				description: faker.lorem.sentence()
			});
		} catch (error) {
			console.error('USER ERROR', error);
		}
	}

	process.exit();
})();