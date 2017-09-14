"use strict";
const express_1 = require("express");
const router = express_1.Router();
router.get('/:id', function (req, res, next) {
    console.log(req.query);
});
module.exports = router;
//# sourceMappingURL=channel.api.js.map