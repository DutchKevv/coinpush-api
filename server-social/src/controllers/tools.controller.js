"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const faker = require("faker");
const user_1 = require("../schemas/user");
const user_controller_1 = require("./user.controller");
exports.toolsController = {
    injectUsers(amount = 1) {
        let i = 0;
        while (i++ < amount) {
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
    },
    async updateFieldType(collection, oldFieldName, newFieldName, newFieldType) {
        const rows = await user_1.User.find({ followers: { $type: 2 } });
        console.log(rows);
        rows.forEach(function (x) {
            x.following = [];
            x.followers = [];
            x.save(x);
        });
    }
};
//# sourceMappingURL=tools.controller.js.map