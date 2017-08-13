import {Router} from 'express';
import {User} from '../schemas/user';

const router = Router();

router.get('/followers', function (req: any, res, next) {
	console.log('get foollowers');
	// User.findById(req.user.id, (error, user) => {
	// 	if (error)
	// 		return next(error);
	//
	// 	res.send(user.followers);
	// });
});

router.post('/:id', async function (req: any, res) {
	try {
		res.send(await User.toggleFollow(req.user.id, req.params.id));
	} catch (error) {
		res.status(500).status(error);
	}
});

export = router;