import { Router } from 'express';
import * as request from 'request-promise';
import * as httpProxy from 'http-proxy';
import { userController } from '../controllers/user.controller';
import { deviceController } from '../controllers/device.controller';

const config = require('../../../tradejs.config');
const router = Router();

/**
 * add device
 */
router.post('/device', async (req, res, next) => {
	try {
		res.send(await deviceController.add(req.user, req.body));
	} catch (error) {
		next(error);
	}
});

/**
 * Delete
 */
router.delete('/device/:id', async (req, res, next) => {
	try {
		res.send(await deviceController.remove(req.user, req.body));
	} catch (error) {
		next(error);
	}
});

export = router;