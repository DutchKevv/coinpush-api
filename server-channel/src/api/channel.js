"use strict";
const express_1 = require("express");
const channel_controller_1 = require("../controllers/channel.controller");
const router = express_1.Router();
/**
 * GET SINGLE
 */
router.get('/:id', async (req, res, next) => {
    try {
        res.send(await channel_controller_1.channelController.findById(req.user, req.query));
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET LIST
 */
router.get('/', async (req, res, next) => {
    try {
        const pList = [], result = {};
        if (req.query.user)
            pList.push(['user', channel_controller_1.channelController.findByUserId(req.user, req.query.user)]);
        else
            pList.push(['editorChoice', channel_controller_1.channelController.findMany(req.user)]);
        const pResults = await Promise.all(pList.map(p => p[1]));
        pResults.forEach((channels, index) => {
            result[pList[index][0]] = channels;
        });
        res.send(result);
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});
/**
 * FOLLOW (TOGGLE)
 */
router.post('/:id/follow', async (req, res, next) => {
    try {
        res.send(await channel_controller_1.channelController.toggleFollow(req.user, req.params.id));
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});
/**
 * COPY (TOGGLE)
 */
router.post('/:id/copy', async (req, res, next) => {
    try {
        res.send(await channel_controller_1.channelController.toggleCopy(req.user, req.params.id));
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});
/**
 * Create
 */
router.post('/', async (req, res, next) => {
    try {
        res.send(await channel_controller_1.channelController.create(req.user.id, req.body));
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});
/**
 * Update
 */
router.put('/:id', async (req, res, next) => {
    try {
        res.send(await channel_controller_1.channelController.update(req.user.id, req.params.id, req.body));
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});
/**
 * Delete
 */
router.delete('/:id', async (req, res, next) => {
    try {
        res.send(await channel_controller_1.channelController.delete(req.user.id, req.params.id));
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});
module.exports = router;
//# sourceMappingURL=channel.js.map