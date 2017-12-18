import {Router} from 'express';
import {symbolController} from "../controllers/symbol.controller";
import { app } from '../app';

const router = Router();

router.get('/', (req, res, next) => {
	try {
		res.send(app.broker.symbols);
	} catch (error) {
		next(error);
	}
});

export = router;