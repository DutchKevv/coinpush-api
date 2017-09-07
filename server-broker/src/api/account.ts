import {Router} from 'express';
import {Order} from '../schemas/order';
import {orderController} from '../controllers/order.controller';

const router = Router();

router.get('/', async (req, res) => {
	try {
		res.send(await orderController.findByUserId(req.user.id));
	} catch (error) {
		res.status(500).send(error);
	}
});

export = router;