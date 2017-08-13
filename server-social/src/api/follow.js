"use strict";
const express_1 = require("express");
const user_1 = require("../schemas/user");
const router = express_1.Router();
router.get('/followers', function (req, res, next) {
    console.log('get foollowers');
    // User.findById(req.user.id, (error, user) => {
    // 	if (error)
    // 		return next(error);
    //
    // 	res.send(user.followers);
    // });
});
router.post('/:id', async function (req, res) {
    try {
        res.send(await user_1.User.toggleFollow(req.user.id, req.params.id));
    }
    catch (error) {
        res.status(500).status(error);
    }
});
module.exports = router;
//# sourceMappingURL=follow.js.map