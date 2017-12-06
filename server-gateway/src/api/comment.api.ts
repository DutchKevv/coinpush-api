import { Router } from 'express';
import { commentController } from '../controllers/comment.controller';

const router = Router();

/**
 * Single
 */
router.get('/:id', async (req, res, next) => {
	try {
		res.send(await commentController.findById(req.user, req.params.id));
	} catch (error) {
		next(error);
	}
});

/**
 * List
 */
router.get('/', async (req, res, next) => {
	try {
		if (req.query.user)
			res.send(await commentController.findByUserId(req.user, req.query.user));
		else
			res.send([]);
	} catch (error) {
		next(error);
	}
});

/**
 * Like
 */
router.post('/like/:id', async (req, res, next) => {
	try {
		res.send(await commentController.toggleLike(req.user, req.params.id));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

/**
 * Create
 */
router.post('/', async (req, res, next) => {
	try {
		res.send(await commentController.create(req.user, req.body));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

/**
 * Update
 */
router.put('/:id', async (req, res, next) => {
	try {
		res.send(await commentController.update(req.user, req.params.id, req.body));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

/**
 * Delete
 */
router.delete('/:id', async (req, res, next) => {
	try {
		res.send(await commentController.remove(req.user, req.params.id));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

export = router;