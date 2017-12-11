import {Router} from 'express';
import {eventController} from "../controllers/event.controller";
import { app } from '../app';

const router = Router();

router.get('/', (req, res, next) => {
	try {
		eventController.findMany(req.user);
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

router.delete('/', (req, res, next) => {
	try {
		
	} catch (error) {
		next(error);
	}
});

export = router;