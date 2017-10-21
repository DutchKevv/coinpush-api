import {Router} from 'express';
import {User} from '../schemas/user';
import {authenticateController} from '../controllers/authenticate.controller';

const router = Router();

router.post('/', async (req, res, next) => {
	try {
		const result = await authenticateController.authenticate(req.user, req.body, req.body.fields);

		if (!result)
			res.status(401);

		res.send(result);
	} catch (error) {
		console.error(error);
		next(error)
	}
});

export = router;