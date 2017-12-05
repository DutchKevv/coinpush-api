import {Router} from 'express';
import {userController} from '../controllers/user.controller';
import { G_ERROR_DUPLICATE } from '../../../shared/constants/constants';

const router = Router();

/**
 * single
 */
router.get('/:id', async (req: any, res, next) => {
	try {
		res.send(await userController.find(req.user, req.params.id));
	} catch (error) {
		next(error);
	}
});

/**
 * list
 */
router.get('/', async (req: any, res, next) => {
	try {
		res.send(await userController.findMany(req.user, req.query));
	} catch (error) {
		next(error);
	}
});

/**
 * create
 */
router.post('/', async (req: any, res, next) => {
	try {
		res.send(await userController.create(req.user, req.body, req.query));
	} catch (error) {
		if (error) {
			console.log('2222', error);
			if (error.name === 'ValidationError') {
				res.status(409).send({ code: G_ERROR_DUPLICATE, field: Object.keys(error.errors)[0] });
				return;
			}
		}
		next(error);
	}
});

/**
 * update
 */
router.put('/:id', async (req: any, res, next) => {
	try {
		res.send(await userController.update(req.user, req.params.id, req.body));
	} catch (error) {
		next(error);
	}
});

/**
 * delete
 */
router.delete('/:id', async (req: any, res, next) => {
	try {
		const result = await userController.remove(req.user, req.params.id);
		res.send();
	} catch (error) {
		next(error)
	}
});

export = router;