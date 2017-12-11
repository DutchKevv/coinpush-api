import * as httpProxy from 'http-proxy';
import {Router} from 'express';
import { eventController } from '../controllers/event.controller';

const config = require('../../../tradejs.config');
const proxy = httpProxy.createProxyServer({
	target: config.server.order.apiUrl + '/event'
});

proxy.on('error', function(err, req, res) {
    res.end();
})

const router = Router();

proxy.on('error', function(err, req, res) {
    res.end();
})

proxy.on('error', function (err, req, res) {
	console.error(err);
});

/**
 * Single
 */
router.get('/:id', function (req, res, next) {
	proxy.web(req, res, {target: config.server.order.apiUrl + '/event'});
});

/**
 * List
 */
router.get('/', (req, res) => {
	proxy.web(req, res, {target: config.server.event.apiUrl + '/event'});
});

/**
 * Create
 */
router.post('/', async (req, res, next) => {
	try {
		res.send(await eventController.create(req.user, req.body));
	} catch (error) {
		next(error);
	}
});

/**
 * Delete
 */
router.delete('/:id', async (req, res, next) => {
	proxy.web(req, res, {target: config.server.order.apiUrl + '/event'});
});


export = router;