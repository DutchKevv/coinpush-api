import {Router} from 'express';
import {authenticateController} from '../controllers/authenticate.controller';
const config = require('../../../tradejs.config');
const router = Router();

/**
 * login
 */
router.post('/', async (req, res, next) => {
	try {
		res.send(await authenticateController.authenticate(req.user, req.body));
	} catch (error) {
		if (error && error.statusCode === 401)
			return res.send(401);

		next(error);
	}
});

export = router;