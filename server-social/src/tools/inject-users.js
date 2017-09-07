"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const faker = require("faker");
const user_controller_1 = require("../controllers/user.controller");
let i = 0;
while (i++ < 1000) {
    user_controller_1.userController.create({
        username: faker.name.findName(),
        email: faker.internet.email(),
        country: faker.address.countryCode(),
        password: faker.internet.password(),
        passwordConf: faker.internet.password(),
        profileImg: faker.random.image(),
        description: faker.lorem.sentence()
    });
}
//# sourceMappingURL=inject-users.js.map