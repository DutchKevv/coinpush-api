"use strict";
const express_1 = require("express");
const order_1 = require("../schemas/order");
const constants_1 = require("../../../shared/constants/constants");
const order_controller_1 = require("../controllers/order.controller");
const router = express_1.Router();
router.get('/:id', async (req, res, next) => {
    try {
        res.send(await order_controller_1.orderController.findById(req.user, req.user.id));
    }
    catch (error) {
        next(error);
    }
});
router.get('/', async (req, res) => {
    try {
        res.send(await order_controller_1.orderController.findByUserId(req.user, req.user.id));
    }
    catch (error) {
        res.status(500).send(error);
    }
});
router.post('/', async (req, res) => {
    let params = {
        amount: req.body.amount,
        symbol: req.body.symbol,
        side: req.body.side,
        stopLoss: req.body.stopLoss,
        takeProfit: req.body.takeProfit,
        trailingStop: req.body.trailingStop,
        type: req.body.type || constants_1.ORDER_TYPE_MARKET,
        user: req.user.id
    };
    if (typeof params.symbol !== 'string' ||
        typeof params.amount !== 'number' ||
        typeof params.side !== 'number') {
        return res.status(400).send('Missing attributes');
    }
    try {
        res.send(await order_controller_1.orderController.create(params));
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
router.put('/:id', function (req, res, next) {
    order_1.Order.unFollow(req.user.id, req.params.id, error => {
        if (error)
            return next(error);
        res.status(200).end();
    });
});
router.delete('/:id', async (req, res, next) => {
    try {
        res.send(await order_controller_1.orderController.close(req.user, req.params.id));
    }
    catch (error) {
        next(error);
    }
});
module.exports = router;
//# sourceMappingURL=order.js.map