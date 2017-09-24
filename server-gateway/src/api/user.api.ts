import {Router} from 'express';
import * as httpProxy from 'http-proxy';
import {userController} from '../controllers/user.controller';
const config = require('../../../tradejs.config');
const router = Router();

/**
 * Single
 */
router.get('/:id', async (req, res, next) => {
	try {
		res.send(await userController.find(req.user, req.params.id, req.query));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

/**
 * List
 */
router.get('/', async (req, res, next) => {
	try {
		res.send(await userController.findMany(req.user.id, req.query));
	} catch (error) {
		console.error(error);
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
		console.error(error);
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
		console.error(error);
		next(error);
	}
});

/**
 * Create
 */
router.post('/', async (req, res, next) => {
	console.log('POST POST POST!!')

	try {
		res.send(await userController.create(req.user, req.body));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

/**
 * Update
 */
router.put('/', async (req, res, next) => {
	try {
		res.send(await userController.update(req.user.id, req.body));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

export = router;