"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const faker = require("faker");
const user_controller_1 = require("../controllers/user.controller");
const mongoose = require("mongoose");
const config = require('../../../tradejs.config');
mongoose.Promise = global.Promise;
mongoose.connect(config.server.social.connectionString);
// Export userIds
(async () => {
    let i = 0;
    while (i++ < 1000) {
        console.log('user:', i);
        try {
            await user_controller_1.userController.create({
                username: faker.name.findName(),
                email: faker.internet.email(),
                country: faker.address.countryCode(),
                password: faker.internet.password(),
                passwordConf: faker.internet.password(),
                profileImg: faker.random.image(),
                description: faker.lorem.sentence()
            });
        }
        catch (error) {
            console.error('USER ERROR', error);
        }
    }
    process.exit();
})();
/*
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
*/ 
//# sourceMappingURL=inject-users.js.map