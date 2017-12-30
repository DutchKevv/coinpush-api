import {Router} from 'express';
import * as httpProxy from 'http-proxy';
import {userController} from '../controllers/user.controller';

const router = Router();

/**
 * add device
 */
router.post('/', async (req, res, next) => {
	// try {
	// 	res.send(await eventController.create(req.user, req.body));
	// } catch (error) {
	// 	next(error);
	// }
});

/**
 * Delete
 */
router.delete('/:id', async (req, res, next) => {
	// try {
	// 	res.send(await eventController.remove(req.user, req.params.id));
	// } catch (error) {
	// 	next(error);
	// }
});

export = router;