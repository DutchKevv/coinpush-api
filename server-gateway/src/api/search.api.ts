import {Router} from 'express';
import {searchController} from '../controllers/search.controller';

const router = Router();

/**
 * Search
 */
router.get('/', async (req, res, next) => {
	try {
		res.send(await searchController.byText(req.user, req.query));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

export = router;