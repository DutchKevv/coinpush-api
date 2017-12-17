import {Router} from 'express';
import {favoriteController} from '../controllers/favorite.controller';
import {userController} from '../controllers/user.controller';

const router = Router();

/**
 * all
 */
router.get('/', async (req: any, res, next) => {
	try {
		res.send(await userController.findById(req.user, req.user, null, ['favorites']));
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
		if (req.body.state)
			await favoriteController.set(req.user, req.body.symbol);
		else
			await favoriteController.unset(req.user, req.body.symbol);

		res.sendStatus(200);
	} catch (error) {
		next(error);
	}
});

export = router;