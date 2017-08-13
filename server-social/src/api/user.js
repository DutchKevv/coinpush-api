"use strict";
const express_1 = require("express");
const user_1 = require("../schemas/user");
const user_controller_1 = require("../controllers/user.controller");
const router = express_1.Router();
const getRootAllowedFields = ['_id', 'username', 'profileImg', 'country', 'followers', 'following', 'followersCount', 'followingCount'];
router.get('/', async function (req, res, next) {
    // Filter allowed fields
    const fields = {};
    (req.body.fields || []).filter(field => getRootAllowedFields.includes(field)).forEach(field => fields[field] = 1);
    try {
        res.send(await user_1.User.aggregate([
            {
                $project: {
                    username: 1,
                }
            }
        ], fields));
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', function (req, res, next) {
    const fields = {};
    (req.body.fields || []).forEach(field => fields[field] = 1);
    user_1.User.findById(req.params.id, fields)
        .exec((error, user) => {
        if (error) {
            return next(error);
        }
        else {
            res.send(user);
        }
    });
});
router.post('/', async (req, res) => {
    try {
        res.send(await user_controller_1.userController.create(req.body));
    }
    catch (error) {
        res.status(500).send(error);
    }
});
module.exports = router;
//# sourceMappingURL=user.js.map