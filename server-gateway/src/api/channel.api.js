"use strict";
const express_1 = require("express");
const request = require("request-promise");
const channel_controller_1 = require("../controllers/channel.controller");
const config = require('../../../tradejs.config');
const router = express_1.Router();
/**
 * Single
 */
router.get('/:id', function (req, res, next) {
    console.log(req.query);
});
/**
 * List
 */
router.get('/', async (req, res, next) => {
    // Get user main channel
    const channels = await request({
        uri: config.server.channel.apiUrl + '/channel/',
        method: 'GET',
        headers: { '_id': req.user.id },
        qs: {
            user: req.query.user || req.user.id
        },
        json: true
    });
    res.send(channels);
});
router.post('/', function (req, res, next) {
    channel_controller_1.channelController.create(req.user.id, req.body);
});
/**
 * Follow
 */
router.post('/:id/follow', async (req, res, next) => {
    try {
        res.send(await channel_controller_1.channelController.toggleFollow(req.user.id, req.params.id));
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
        res.send(await channel_controller_1.channelController.toggleCopy(req.user.id, req.params.id));
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});
module.exports = router;
//# sourceMappingURL=channel.api.js.map