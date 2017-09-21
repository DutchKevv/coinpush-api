"use strict";
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const router = express_1.Router();
router.get('/:id', async (req, res, next) => {
    try {
        res.send(await user_controller_1.userController.get(req.user, req.params.id, parseInt(req.query.type, 10)));
    }
    catch (error) {
        next(error);
    }
});
router.post('/', async (req, res) => {
    try {
        res.send(await user_controller_1.userController.create(req.body));
    }
    catch (error) {
        res.status(500).send(error);
    }
});
router.put('/:id', async (req, res) => {
    try {
        res.send(await user_controller_1.userController.update(req.params.id, req.body));
    }
    catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        res.send(await user_controller_1.userController.remove(req.params.id));
    }
    catch (error) {
        console.log(error);
        next(error);
    }
});
module.exports = router;
//# sourceMappingURL=user.js.map