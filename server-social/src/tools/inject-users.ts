import * as faker from 'faker';
import {userController} from '../controllers/user.controller';

let i = 0;

while (i++ < 1000) {

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