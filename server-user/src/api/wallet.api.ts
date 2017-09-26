import {Router} from 'express';
import {walletController} from '../controllers/wallet.controller';

const router = Router();

/**
 * update
 */
router.put('/:id', async (req: any, res, next) => {
	try {
		res.send(await walletController.updateBalance(req.user, req.params.id, req.body));
	} catch (error) {
		console.log(error);
		next(error);
	}
});

export = router;