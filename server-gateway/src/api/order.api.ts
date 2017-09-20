import * as httpProxy from 'http-proxy';
import {Router} from 'express';
import {orderController} from '../controllers/order.controller';

const config = require('../../../tradejs.config');
const proxy = httpProxy.createProxyServer({});
const router = Router();

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
router.get('/', (req, res) => {
	proxy.web(req, res, {target: config.server.order.apiUrl + '/order'});
});

/**
 * Create
 */
router.post('/', async (req, res, next) => {
	try {
		res.send(await orderController.create(req.user, req.body));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

/**
 * Delete
 */
router.delete('/:id', async (req, res, next) => {
	proxy.web(req, res, {target: config.server.order.apiUrl + '/order'});
});


export = router;