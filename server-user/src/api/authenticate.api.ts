import {Router} from 'express';
import {authenticateController} from '../controllers/authenticate.controller';
import {userController} from "../controllers/user.controller";

const router = Router();

router.post('/request-password-reset', async (req, res, next) => {
	try {
		res.send(await userController.requestPasswordReset(req.user, req.body.email));
	} catch (error) {
		next(error);
	}
});

router.post('/', async (req, res, next) => {
	try {
		const result = await authenticateController.authenticate(req.user, req.body, req.body.fields);

		if (!result)
			res.status(401);

		res.send(result);
	} catch (error) {
		next(error)
	}
});

export = router;