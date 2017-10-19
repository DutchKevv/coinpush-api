import {Router} from 'express';
import {symbolController} from "../controllers/symbol.controller";

const router = Router();

router.get('/symbols', (req, res, next) => {
	try {
		res.send(symbolController.symbols);
	} catch (error) {
		next(error);
	}
});

export = router;