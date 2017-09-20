"use strict";
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const router = express_1.Router();
router.get('/', async function (req, res) {
    try {
        res.send(await user_controller_1.userController.getMany(req.user.id, req.body));
    }
    catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
});
module.exports = router;
//# sourceMappingURL=users.js.map