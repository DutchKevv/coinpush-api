import {Router} from 'express';
import * as httpProxy from 'http-proxy';
import {userController} from '../controllers/user.controller';

const router = Router();

/**
 * Single
 */
router.get('/:id', async (req, res, next) => {
	try {
		if (req.query.type)
			req.query.type = parseInt(req.query.type, 10);

		res.send(await userController.findById(req.user, req.params.id, req.query));
	} catch (error) {
		next(error);
	}
});

/**
 * List
 */
router.get('/', async (req, res, next) => {
	try {
		res.send(await userController.findMany(req.user, req.query));
	} catch (error) {
		next(error);
	}
});

/**
 * Follow
 */
router.post('/:id/follow', async (req, res, next) => {
	try {
		res.send(await userController.toggleFollow(req.user, req.params.id));
	} catch (error) {
		next(error);
	}
});

/**
 * Copy
 */
router.post('/:id/copy', async (req, res, next) => {
	try {
		res.send(await userController.toggleCopy(req.user, req.params.id));
	} catch (error) {
		next(error);
	}
});

/**
 * Create
 */
router.post('/', async (req, res, next) => {
	try {
		res.send(await userController.create(req.user, req.body));
	} catch (error) {
		next(error);
	}
});

/**
 * Update
 */
router.put('/:id', async (req, res, next) => {
	try {
		res.send(await userController.update(req.user, req.params.id, req.body));
	} catch (error) {
		next(error);
	}
});

/**
 * delete
 */
router.delete('/:id', async (req, res, next) => {
	try {
		console.log('user user', req.user, req.params.id);
		res.send(await userController.remove(req.user, req.params.id));
	} catch (error) {
		next(error);
	}
});


export = router;