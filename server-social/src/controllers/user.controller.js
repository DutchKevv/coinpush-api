"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("../schemas/user");
exports.userController = {
    async create(params) {
        let userData = {
            email: params.email,
            username: params.username,
            password: params.password,
            passwordConf: params.passwordConf,
            profileImg: params.profileImg,
            country: params.country,
            description: params.description
        };
        if (!userData.email || !userData.username || !userData.password || !userData.passwordConf)
            throw 'Missing attributes';
        // use schema.create to insert data into the db
        return user_1.User.create(userData);
    },
    getAllowedFields: ['_id', 'username', 'profileImg', 'country', 'followers', 'following'],
    async getMany(params, reqUserId) {
        const limit = params.limit || 20;
        const sort = params.sort || -1;
        // Filter allowed fields
        const fields = {};
        (params.fields || this.getAllowedFields).filter(field => this.getAllowedFields.includes(field)).forEach(field => fields[field] = 1);
        const usersQuery = user_1.User.aggregate([
            {
                $project: Object.assign({ followersCount: { $size: { '$ifNull': ['$followers', []] } }, followingCount: { $size: { '$ifNull': ['$following', []] } } }, fields)
            },
            {
                $sort: {
                    _id: sort
                }
            },
            {
                $limit: limit
            }
        ]);
        const data = await Promise.all([usersQuery, user_1.User.findById(reqUserId)]);
        const following = data[1].following;
        data[0].forEach(user => {
            if (!user.profileImg)
                user.profileImg = 'http://localhost/images/default/profile/nl.png';
            user.follow = following.indexOf(user._id) > -1;
        });
        return data[0];
    }
};
//# sourceMappingURL=user.controller.js.map