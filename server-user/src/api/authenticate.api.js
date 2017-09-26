"use strict";
const express_1 = require("express");
const user_1 = require("../schemas/user");
const authenticate_controller_1 = require("../controllers/authenticate.controller");
const router = express_1.Router();
router.get('/', function (req, res, next) {
    user_1.User.authenticate({}, function (err, users) {
        if (err)
            return next(err);
        res.send(users);
    });
});
router.post('/', async (req, res, next) => {
    try {
        const result = await authenticate_controller_1.authenticateController.login(req.body.email, req.body.password);
        if (!result)
            res.status(401);
        res.send(result);
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});
module.exports = router;
//# sourceMappingURL=authenticate.api.js.map