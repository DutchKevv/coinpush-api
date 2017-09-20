import {Router} from 'express';
import * as request from 'request-promise';
import {channelController} from '../controllers/channel.controller';

const config = require('../../../tradejs.config');
const router = Router();

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

router.post('/', function (req, res, next) {
	channelController.create(req.user.id, req.body)
});

/**
 * Follow
 */
router.post('/:id/follow', async (req, res, next) => {
	try {
		res.send(await channelController.toggleFollow(req.user.id, req.params.id));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

/**
 * Copy
 */
router.post('/:id/copy', async (req, res, next) => {
	try {
		res.send(await channelController.toggleCopy(req.user.id, req.params.id));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

export = router;