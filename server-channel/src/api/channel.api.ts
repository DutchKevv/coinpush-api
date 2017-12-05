import {Router} from 'express';
import {channelController} from '../controllers/channel.controller';
import { G_ERROR_DUPLICATE } from '../../../shared/constants/constants';

const router = Router();

/**
 * GET FOLLOWERS
 */
router.get('/:id/follow', async (req, res, next) => {
	try {
		res.send(await channelController.getFollowers(req.user, req.params.id, req.query));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

/**
 * GET COPIERS
 */
router.get('/:id/follow', async (req, res, next) => {
	try {
		res.send(await channelController.toggleFollow(req.user, req.params.id));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

/**
 * GET SINGLE
 */
router.get('/:id', async (req, res, next) => {
	try {
		res.send(await channelController.findById(req.user, req.params.id, req.query));
	} catch (error) {
		next(error);
	}
});

/**
 * GET LIST
 */
router.get('/', async (req, res, next) => {
	try {
		const pList = [], result = {};

		console.log('fuck off', req.query);

		if (req.query.user)
			pList.push(['user', channelController.findByUserId(req.user, req.query.user, req.query)]);
		else
			pList.push(['editorChoice', channelController.findMany(req.user)]);

		const pResults = await Promise.all(pList.map(p => p[1]));

		pResults.forEach((channels, index) => {
			result[pList[index][0]] = channels;
		});

		res.send(result);

	} catch (error) {
		console.error(error);
		next(error);
	}
});

/**
 * FOLLOW (TOGGLE)
 */
router.post('/:id/follow', async (req, res, next) => {
	try {
		res.send(await channelController.toggleFollow(req.user, req.params.id));
	} catch (error) {
		next(error);
	}
});

/**
 * COPY (TOGGLE)
 */
router.post('/:id/copy', async (req, res, next) => {
	try {
		res.send(await channelController.toggleCopy(req.user, req.params.id));
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
		res.send(await channelController.create(req.user, req.body, req.body.type));
	} catch (error) {
		if (error) {
			console.log('sadfsdf', error);
			if (error.name === 'ValidationError') {
				res.status(409).send({ code: G_ERROR_DUPLICATE, field: Object.keys(error.errors)[0] });
				return;
			}
		}
		next(error);
	}
});

/**
 * Update
 */
router.put('/:id?', async (req, res, next) => {
	try {
		if (req.params.id)
			res.send(await channelController.update(req.user, req.params.id, req.body));
		else if (req.query.user)
			res.send(await channelController.updateByUserId(req.user, req.query.user, req.body));
		else
			next();
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
		res.send(await channelController.removeById(req.user, req.params.id));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

export = router;