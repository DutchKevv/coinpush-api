import { Router } from 'express';
import * as httpProxy from 'http-proxy';
import { deviceController } from '../controllers/device.controller';

const config = require('../../../tradejs.config');
const router = Router();

/**
 * add device
 */
router.post('/', async (req, res, next) => {
	try {
		res.send(await deviceController.add(req.user, req.body));
	} catch (error) {
		next(error);
	}
});

/**
 * Delete
 */
router.delete('/:id', async (req, res, next) => {
	try {
		res.send(await deviceController.remove(req.user, req.params.id));
	} catch (error) {
		next(error);
	}
});

export = router;