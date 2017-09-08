import {Router} from 'express';
import {Candle} from '../schemas/candle';

import {cacheController} from '../controllers/cache.controller';

const router = Router();

router.get('/:id', function (req, res, next) {
	console.log(req.query);

	cacheController.find(req.query);
});

export = router;