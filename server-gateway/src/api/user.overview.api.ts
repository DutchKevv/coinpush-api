import {Router} from 'express';
import {userOverviewController} from '../controllers/user.overview.controller';

const router = Router();

/**
 * Get overview
 */
router.get('/', async (req, res, next) => {
	try {
		console.log('GET OVERVIEW!');
		res.send(await userOverviewController.getOverview(req.user, {}));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

export = router;