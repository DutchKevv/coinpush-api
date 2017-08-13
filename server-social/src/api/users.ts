import {Router} from 'express';
import {User} from '../schemas/user';
import {userController} from '../controllers/user.controller';

const router = Router();

router.get('/', async function (req: any, res) {
	try {
		res.send(await userController.getMany(req.body, req.user.id));
	} catch (error) {
		console.log(error);
		res.status(500).send(error);
	}
});

export = router;