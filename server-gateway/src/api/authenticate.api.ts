import {Router} from 'express';
import * as httpProxy from 'http-proxy';
import {authenticateController} from '../controllers/authenticate.controller';
const config = require('../../../tradejs.config');
const router = Router();

/**
 * login
 */
router.post('/', async (req, res, next) => {
	try {
		res.send(await authenticateController.login(req.body.email, req.body.password));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

export = router;