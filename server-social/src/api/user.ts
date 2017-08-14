import {Router} from 'express';
import {User} from '../schemas/user';
import {userController} from '../controllers/user.controller';

const router = Router();

router.get('/', async function (req: any, res, next) {
	try {
		res.send(await userController.get(req.user.id));
	} catch (error) {
		next(error);
	}
});

router.get('/:id', function (req, res, next) {
	const fields = {};
	(req.body.fields || []).forEach(field => fields[field] = 1);

	User.findById(req.params.id, fields)
		.exec((error, user) => {
			if (error) {
				return next(error);
			} else {
				res.send(user);
			}
		});
});

router.post('/', async (req, res) => {
	try {
		res.send(await userController.create(req.body));
	} catch (error) {
		res.status(500).send(error);
	}
});

router.put('/', async (req: any, res) => {
	try {
		res.send(await userController.update(req.body, req.user.id));
	} catch (error) {
		res.status(500).send(error);
	}
});

export = router;