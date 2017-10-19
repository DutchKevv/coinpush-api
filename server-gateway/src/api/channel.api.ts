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
router.get('/:id', async (req, res, next) => {
	try {
		res.send(await channelController.findById(req.user, req.params.id));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

/**
 * List
 */
router.get('/', async (req, res, next) => {
	try {
		res.send(await channelController.findByUserId(req.user, req.query.user));
	} catch (error) {
		console.error(error);
		next(error);
	}
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
router.put('/:id', async (req, res, next) => {
	try {
		res.send(await channelController.update(req.user, req.params.id, req.body));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

/**
 * Delete
 */
router.delete('/:id', async (req, res, next) => {
	try {
		res.send(await channelController.remove(req.user, req.params.id));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

export = router;