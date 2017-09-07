"use strict";
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const router = express_1.Router();
router.get('/', async (req, res) => {
    try {
        res.send(await order_controller_1.orderController.findByUserId(req.user.id));
    }
    catch (error) {
        res.status(500).send(error);
    }
});
module.exports = router;
//# sourceMappingURL=account.js.map