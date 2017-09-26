"use strict";
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const router = express_1.Router();
/**
 * single
 */
router.get('/:id', async (req, res, next) => {
    try {
        res.send(await user_controller_1.userController.find(req.user, req.params.id, parseInt(req.query.type, 10)));
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});
/**
 * list
 */
router.get('/', async (req, res, next) => {
    try {
        res.send(await user_controller_1.userController.findMany(req.user, req.query));
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});
/**
 * create
 */
router.post('/', async (req, res) => {
    try {
        res.send(await user_controller_1.userController.create(req.body));
    }
    catch (error) {
        res.status(500).send(error);
    }
});
/**
 * update
 */
router.put('/:id', async (req, res) => {
    try {
        res.send(await user_controller_1.userController.update(req.user, req.params.id, req.body));
    }
    catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
});
/**
 * delete
 */
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
//# sourceMappingURL=user.api.js.map