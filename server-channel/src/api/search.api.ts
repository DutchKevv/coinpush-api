import {Router} from 'express';
import {channelController} from '../controllers/channel.controller';

const router = Router();

/**
 * Search
 */
router.get('/', async (req, res, next) => {
	try {
		res.send(await channelController.findMany(req.user, req.query));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

export = router;