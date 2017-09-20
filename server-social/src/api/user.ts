import {Router} from 'express';
import {userController} from '../controllers/user.controller';

const router = Router();

router.get('/:id', async (req: any, res, next) => {
	try {
		res.send(await userController.get(req.params.id, parseInt(req.query.type, 10)));
	} catch (error) {
		next(error);
	}
});

router.post('/', async (req, res) => {
	try {
		res.send(await userController.create(req.body));
	} catch (error) {
		res.status(500).send(error);
	}
});

router.put('/:id', async (req: any, res) => {
	try {
		res.send(await userController.update(req.params.id, req.body));
	} catch (error) {
		console.log(error);
		res.status(500).send(error);
	}
});

router.delete('/:id', async (req: any, res, next) => {
	try {
		res.send(await userController.remove(req.params.id));
	} catch (error) {
		console.log(error);
		next(error)
	}
});

export = router;