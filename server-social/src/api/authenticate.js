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
    console.log(req.body);
    if (!req.body.username || !req.body.password)
        return res.status(400).send('Username or password is incorrect');
    let userData = {
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        passwordConf: req.body.passwordConf
    };
    user_1.User.authenticate(req.body.username, req.body.password, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error');
        }
        if (!result)
            return res.status(400).send('Username or password is incorrect');
        res.send(result);
    });
});
module.exports = router;
//# sourceMappingURL=authenticate.js.map