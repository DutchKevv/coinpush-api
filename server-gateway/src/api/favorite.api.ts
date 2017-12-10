import {Router} from 'express';
import {favoriteController} from '../controllers/favorite.controller';

const router = Router();

/**
 * all
 */
router.get('/', async (req: any, res, next) => {

});

/**
 * toggle
 */
router.post('/', async (req: any, res, next) => {
	try {
		res.send(await favoriteController.toggle(req.user, req.body));
	} catch (error) {
		next(error);
	}
});

export = router;