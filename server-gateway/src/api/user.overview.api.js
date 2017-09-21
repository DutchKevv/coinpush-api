"use strict";
const express_1 = require("express");
const user_overview_controller_1 = require("../controllers/user.overview.controller");
const router = express_1.Router();
/**
 * Get overview
 */
router.get('/', async (req, res, next) => {
    try {
        console.log('GET OVERVIEW!');
        res.send(await user_overview_controller_1.userOverviewController.getOverview(req.user, {}));
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});
module.exports = router;
//# sourceMappingURL=user.overview.api.js.map