import {Router} from 'express';
import {commentController} from '../controllers/comment.controller';

const router = Router();

/**
 * Single
 */
router.get('/:id', async (req, res, next) => {
	try {
		if (req.query.childrenOnly) {
			res.send(await commentController.findChildren(req.user, req.params.id, req.query))
		} else {
			res.send(await commentController.findById(req.user, req.params.id, req.query));
		}
		
	} catch (error) {
		next(error);
	}
});

/**
 * List
 */
router.get('/', async (req, res, next) => {
	try {
		if (req.query.toUserId)
			res.send(await commentController.findByToUserId(req.user, req.query));
		else
			res.send(await commentController.findMany(req.user, req.query.userId));
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
		next(error);
	}
});

/**
 * Update
 */
router.put('/', async (req, res, next) => {
	try {
		res.send(await commentController.findById(req.user, req.params.id));
	} catch (error) {
		next(error);
	}
});

/**
 * Delete
 */
router.delete('/', async (req, res, next) => {
	try {
		res.send(await commentController.findById(req.user, req.params.id));
	} catch (error) {
		next(error);
	}
});

export = router;