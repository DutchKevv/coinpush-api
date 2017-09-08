"use strict";
const express_1 = require("express");
const cache_controller_1 = require("../controllers/cache.controller");
const router = express_1.Router();
router.get('/:id', function (req, res, next) {
    console.log(req.query);
    cache_controller_1.cacheController.find(req.query);
});
module.exports = router;
//# sourceMappingURL=cache.js.map