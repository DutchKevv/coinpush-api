import {Router} from 'express';
import * as httpProxy from 'http-proxy';
import * as request from 'request-promise';
import {channelController} from '../controllers/channel.controller';

const config = require('../../../tradejs.config');
const router = Router();
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
		headers: {'_id': req.user.id},
		qs: {
			user: req.query.user || req.user.id
		},
		json: true
	});

	res.send(channels)
});

/**
 * Follow
 */
router.post('/:id/follow', async (req, res, next) => {
	proxy.web(req, res, {target: config.server.channel.apiUrl + '/channel/'}, next);
});

/**
 * Copy
 */
router.post('/:id/copy', async (req, res, next) => {
	proxy.web(req, res, {target: config.server.channel.apiUrl + '/channel/'}, next);
});
//
/**
 * Create
 */
router.post('/', function (req, res, next) {
	channelController.create(req.user.id, req.body)
});

/**
 * Update
 */
router.put('/', function (req, res, next) {
	channelController.create(req.user.id, req.body)
});

/**
 * Delete
 */
router.delete('/', function (req, res, next) {
	channelController.create(req.user.id, req.body)
});

export = router;