import {Router} from 'express';
import { timelineController } from '../controllers/timeline.controller';

const router = Router();

router.get('/', async (req: any, res, next) => {
	try {
		res.send(await timelineController.get(req.user, req.query));
	} catch (error) {
		next(error);
	}
});

export = router;