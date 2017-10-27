import {Router} from 'express';
import {favoriteController} from '../controllers/favorite.controller';
import {userController} from '../controllers/user.controller';

const router = Router();

/**
 * all
 */
router.get('/', async (req: any, res, next) => {
	try {
		res.send(await userController.find(req.user, req.user, null, ['favorites']));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

/**
 * toggle
 */
router.post('/', async (req: any, res, next) => {
	try {
		res.send(await favoriteController.toggle(req.user, req.body.symbol));
	} catch (error) {
		next(error);
	}
});

export = router;