import {Router} from 'express';
import { symbolController } from '../controllers/symbol.controller';

const router = Router();

/**
 * Search
 */
router.get('/', async (req, res, next) => {
	try {
		res.send(await symbolController.getAll(req.user));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

export = router;