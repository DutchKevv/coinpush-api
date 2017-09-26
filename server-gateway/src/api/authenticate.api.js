"use strict";
const express_1 = require("express");
const authenticate_controller_1 = require("../controllers/authenticate.controller");
const config = require('../../../tradejs.config');
const router = express_1.Router();
/**
 * login
 */
router.post('/', async (req, res, next) => {
    try {
        res.send(await authenticate_controller_1.authenticateController.login(req.body.email, req.body.password));
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});
module.exports = router;
//# sourceMappingURL=authenticate.api.js.map