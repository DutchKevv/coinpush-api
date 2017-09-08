import {Router} from 'express';
import {Candle} from '../schemas/candle';

import {channelController} from '../controllers/channel.controller';

const router = Router();

/**
 * LIST
 */
router.get('/:id?', async (req, res, next) => {
	const type = req.query.type;

	try {

		if (type === 'profile-overview') {

			let results = await Promise.all([
				channelController.findByUserId(req.params.id || req.user.id)
			]);

			res.send({
				user: results[0]
			});
		}

	} catch (error) {
		console.error(error);
		next(error);
	}
});

/**
 * SINGLE
 */
router.get('/:id', function (req, res, next) {
	console.log(req.query);

	channelController.find(req.query);
});

export = router;