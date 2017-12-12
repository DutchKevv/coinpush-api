import {Router} from 'express';
import {eventController} from "../controllers/event.controller";
import { app } from '../app';

const router = Router();

router.get('/:id', async (req, res, next) => {
	try {
		// res.send(await eventController.findMany(req.user, req.req.query));
	} catch (error) {
		next(error);
	}
});

router.get('/', async (req, res, next) => {
	try {
		console.log('asdfasfasdfsdfasdfasdfasfsffdsf', req.query);
		res.send(await eventController.findMany(req.user, req.query));
	} catch (error) {
		next(error);
	}
});

router.post('/', async (req, res, next) => {
	try {
		res.send(await eventController.create(req.user, req.body));
	} catch (error) {
		next(error);
	}
});

router.put('/', (req, res, next) => {
	try {
		
	} catch (error) {
		next(error);
	}
});

router.delete('/:id', async (req, res, next) => {
	try {
		res.send(await eventController.remove(req.user, req.params.id));
	} catch (error) {
		next(error);
	}
});

export = router;