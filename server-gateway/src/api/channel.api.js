"use strict";
const express_1 = require("express");
const httpProxy = require("http-proxy");
const channel_controller_1 = require("../controllers/channel.controller");
const config = require('../../../tradejs.config');
const router = express_1.Router();
const proxy = httpProxy.createProxyServer({});
proxy.on('error', function (err, req, res) {
    console.error(err);
});
/**
 * Single
 */
router.get('/:id', async (req, res, next) => {
    try {
        res.send(await channel_controller_1.channelController.findById(req.user, req.params.id));
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});
/**
 * List
 */
router.get('/', async (req, res, next) => {
    try {
        res.send(await channel_controller_1.channelController.findByUserId(req.user, req.query.user || req.user.id));
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
    proxy.web(req, res, { target: config.server.channel.apiUrl + '/channel/' }, next);
});
/**
 * Copy
 */
router.post('/:id/copy', async (req, res, next) => {
    proxy.web(req, res, { target: config.server.channel.apiUrl + '/channel/' }, next);
});
//
/**
 * Create
 */
router.post('/', function (req, res, next) {
    channel_controller_1.channelController.create(req.user.id, req.body);
});
/**
 * Update
 */
router.put('/:id', async (req, res, next) => {
    try {
        res.send(await channel_controller_1.channelController.update(req.user, req.params.id, req.body));
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
        res.send(await channel_controller_1.channelController.remove(req.user, req.params.id));
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});
module.exports = router;
//# sourceMappingURL=channel.api.js.map