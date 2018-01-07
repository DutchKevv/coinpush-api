import {Router} from 'express';
import {emailController} from '../controllers/email.controller';
import { notifyController } from '../controllers/notify.controller';

const router = Router();

/**
 * get single
 */
router.get('/:id', async (req, res, next) => {
	console.log(req.body);

	try {
		res.send(await notifyController.findById(req.user, req.params.id));
	} catch (error) {
		next(error);
	}
});

/**
 * get multiple
 */
router.get('/', async (req, res, next) => {
	console.log(req.body);

	try {
		res.send(await notifyController.findMany(req.user, req.query));
	} catch (error) {
		next(error);
	}
});

export = router;