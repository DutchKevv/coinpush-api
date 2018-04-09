import {Router} from 'express';
import { cacheController } from '../controllers/cache.controller';

const router = Router();

/**
 * Search
 */
router.get('/', async (req: any, res, next) => {
	try {
		res.send(await cacheController.find(req.user, req.query));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

export = router;