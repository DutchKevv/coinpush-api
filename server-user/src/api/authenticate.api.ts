import {Router} from 'express';
import {User} from '../schemas/user';
import {authenticateController} from '../controllers/authenticate.controller';

const router = Router();

router.get('/', function (req, res, next) {
	User.authenticate({}, function (err, users) {
		if (err)
			return next(err);

		res.send(users);
	});
});

router.post('/', async (req, res, next) => {
	try {
		const result = await authenticateController.login(req.body.email, req.body.password);

		if (!result)
			res.status(401);

		res.send(result);
	} catch (error) {
		console.error(error);
		next(error)
	}
});

export = router;