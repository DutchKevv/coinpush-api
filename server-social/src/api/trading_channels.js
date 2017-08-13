"use strict";
const express_1 = require("express");
const trading_channel_1 = require("../schemas/trading_channel");
const router = express_1.Router();
router.get('/', function (req, res, next) {
    console.log(req.params);
    trading_channel_1.TradingChannel.find({}, function (err, channels) {
        if (err)
            return next(err);
        res.send(channels);
    });
});
router.post('/', (req, res, next) => {
    if (req.body.username && req.body.password && req.body.passwordConf) {
        let userData = {
            email: req.body.email,
            username: req.body.username,
            password: req.body.password,
            passwordConf: req.body.passwordConf
        };
        // use schema.create to insert data into the db
        trading_channel_1.TradingChannel.create(userData, function (err, channel) {
            if (err) {
                // return next(err)
                console.error(err);
            }
            else {
                return res.redirect('/profile');
            }
        });
    }
});
router.get('/:id', function (req, res, next) {
    console.log(req.params);
    trading_channel_1.TradingChannel.findById(req.params.id)
        .exec(function (error, user) {
        if (error) {
            return next(error);
        }
        else {
            if (user === null) {
                const err = new Error('Not authorized! Go back!');
                err['status'] = 400;
                return next(err);
            }
            else {
                return res.send('<h1>Name: </h1>' + user.username + '<h2>Mail: </h2>' + user.email + '<br><a type="button" href="/logout">Logout</a>');
            }
        }
    });
});
module.exports = router;
//# sourceMappingURL=trading_channels.js.map