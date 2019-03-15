import {Router} from 'express';
import {authenticateController} from '../controllers/authenticate.controller';
import {userController} from "../controllers/user.controller";
import { adminController } from '../controllers/admin.controller.';

const router = Router();

router.delete('/comment', async (req: any, res, next) => {
	try {
		res.send(await adminController.clearElkComments());
	} catch (error) {
		next(error);
	}
});

export = router;