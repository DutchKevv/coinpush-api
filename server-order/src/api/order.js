"use strict";
const express_1 = require("express");
const order_1 = require("../schemas/order");
const constants_1 = require("../../../shared/constants/constants");
const order_controller_1 = require("../controllers/order.controller");
const router = express_1.Router();
router.post('/', async (req, res) => {
    let params = {
        amount: req.body.amount,
        symbol: req.body.symbol,
        side: req.body.side,
        stopLoss: req.body.stopLoss,
        takeProfit: req.body.takeProfit,
        trailingStop: req.body.trailingStop,
        type: req.body.type || constants_1.ORDER_TYPE_MARKET,
        users: req.body.users
    };
    console.log('PARAMS', params);
    if (typeof params.symbol !== 'string' ||
        typeof params.amount !== 'number' ||
        typeof params.side !== 'number') {
        return res.status(400).send('Missing attributes');
    }
    try {
        // create array of promises that each create a new order
        const promises = params.users.map((user) => order_controller_1.orderController.create(Object.assign(params, { user })));
        // send result back
        res.send(await Promise.all(promises));
    }
    catch (error) {
        switch (error.code) {
            case constants_1.BROKER_ERROR_INVALID_ARGUMENT:
                res.status(400).send(error);
                break;
            case constants_1.BROKER_ERROR_MARKET_CLOSED:
                res.status(403).send(error);
                break;
            case constants_1.BROKER_ERROR_UNKNOWN:
                res.status(500).send('Unknown error');
                break;
            default:
                res.status(500).send({
                    code: constants_1.BROKER_ERROR_UNKNOWN,
                    error: 'undocumented error occurred'
                });
        }
    }
});
router.get('/:id', function (req, res, next) {
    order_1.Order.findById(req.params.id)
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
router.delete('/:id', function (req, res, next) {
    order_1.Order.follow(req.user.id, req.params.id, error => {
        if (error)
            return next(error);
        res.status(200).end();
    });
});
router.put('/:id', function (req, res, next) {
    order_1.Order.unFollow(req.user.id, req.params.id, error => {
        if (error)
            return next(error);
        res.status(200).end();
    });
});
module.exports = router;
//# sourceMappingURL=order.js.map