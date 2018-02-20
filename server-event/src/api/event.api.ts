import {Router} from 'express';
import {eventController} from "../controllers/event.controller";
import { app } from '../app';

const router = Router();

/**
 * single
 */
router.get('/:id', async (req: any, res, next) => {
	try {
		// res.send(await eventController.findMany(req.user, req.req.query));
	} catch (error) {
		next(error);
	}
});

/**
 * list
 */
router.get('/', async (req: any, res, next) => {
	try {
		res.send(await eventController.findMany(req.user, req.query));
	} catch (error) {
		next(error);
	}
});

/**
 * create
 */
router.post('/', async (req: any, res, next) => {
	try {
		res.send(await eventController.create(req.user, req.body));
	} catch (error) {
		next(error);
	}
});

/**
 * update
 */
router.put('/', (req: any, res, next) => {
	try {
		
	} catch (error) {
		next(error);
	}
});

/**
 * delete
 */
router.delete('/:id', async (req: any, res, next) => {
	try {
		res.send(await eventController.remove(req.user, req.params.id));
	} catch (error) {
		next(error);
	}
});

export = router;