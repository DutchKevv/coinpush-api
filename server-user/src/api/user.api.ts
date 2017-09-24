import {Router} from 'express';
import {userController} from '../controllers/user.controller';

const router = Router();

/**
 * single
 */
router.get('/:id', async (req: any, res, next) => {
	try {
		res.send(await userController.find(req.user, req.params.id, parseInt(req.query.type, 10)));
	} catch (error) {
		console.error(error);
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
		console.error(error);
		next(error);
	}
});

/**
 * create
 */
router.post('/', async (req, res) => {
	try {
		res.send(await userController.create(req.body));
	} catch (error) {
		res.status(500).send(error);
	}
});

/**
 * update
 */
router.put('/:id', async (req: any, res) => {
	try {
		res.send(await userController.update(req.user, req.params.id, req.body));
	} catch (error) {
		console.log(error);
		res.status(500).send(error);
	}
});

/**
 * delete
 */
router.delete('/:id', async (req: any, res, next) => {
	try {
		res.send(await userController.remove(req.params.id));
	} catch (error) {
		console.log(error);
		next(error)
	}
});

export = router;