"use strict";
const express_1 = require("express");
const wallet_controller_1 = require("../controllers/wallet.controller");
const router = express_1.Router();
/**
 * update
 */
router.put('/:id', async (req, res, next) => {
    try {
        res.send(await wallet_controller_1.walletController.updateBalance(req.user, req.params.id, req.body));
    }
    catch (error) {
        console.log(error);
        next(error);
    }
});
module.exports = router;
//# sourceMappingURL=wallet.api.js.map