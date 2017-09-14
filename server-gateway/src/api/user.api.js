"use strict";
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const router = express_1.Router();
/**
 * List
 */
router.get('/', async (req, res, next) => {
    try {
        res.send(await user_controller_1.userController.find(req.query));
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});
/**
 * Find single
 */
router.get('/:id', async (req, res, next) => {
    try {
        res.send(await user_controller_1.userController.find(req.params.id));
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});
/**
 * Update
 */
router.put('/', async (req, res, next) => {
    try {
        res.send(await user_controller_1.userController.update(req.user.id, req.body));
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});
/**
 * Follow
 */
router.post('/:id/follow', async (req, res, next) => {
    try {
        res.send(await user_controller_1.userController.toggleFollow(req.user.id, req.params.id));
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});
/**
 * Copy
 */
router.post('/:id/copy', async (req, res, next) => {
    try {
        console.log('bitch cosadfasfasdfasdfasdfasdfpy');
        res.send(await user_controller_1.userController.toggleCopy(req.user.id, req.params.id));
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});
module.exports = router;
//# sourceMappingURL=user.api.js.map