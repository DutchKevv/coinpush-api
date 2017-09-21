"use strict";
const express_1 = require("express");
const httpProxy = require("http-proxy");
const request = require("request-promise");
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
router.put('/', function (req, res, next) {
    channel_controller_1.channelController.create(req.user.id, req.body);
});
/**
 * Delete
 */
router.delete('/', function (req, res, next) {
    channel_controller_1.channelController.create(req.user.id, req.body);
});
module.exports = router;
//# sourceMappingURL=channel.api.js.map