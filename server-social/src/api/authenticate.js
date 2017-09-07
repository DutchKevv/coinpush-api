"use strict";
const express_1 = require("express");
const user_1 = require("../schemas/user");
const router = express_1.Router();
router.get('/', function (req, res, next) {
    console.log(req.params);
    user_1.User.statics.authenticate({}, function (err, users) {
        if (err)
            return next(err);
        res.send(users);
    });
});
router.post('/', (req, res, next) => {
    if (!req.body.username || !req.body.password)
        return res.status(400).send('Username or password is incorrect');
    user_1.User.authenticate(req.body.username, req.body.password, req.body.token, (err, result) => {
        if (err) {
            console.error(err);
            next(err);
        }
        if (!result)
            return res.status(400).send('Username or password is incorrect');
        res.send(result);
    });
});
module.exports = router;
//# sourceMappingURL=authenticate.js.map