import {Router} from 'express';
import {userController} from '../controllers/user.controller';

const router = Router();

/**
 * List
 */
router.get('/', async (req, res, next) => {
	try {
		res.send(await userController.find(req.query));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

/**
 * Find single
 */
router.get('/:id', async (req, res, next) => {
	try {
		res.send(await userController.find(req.params.id));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

/**
 * Update
 */
router.put('/', async (req, res, next) => {
	try {
		res.send(await userController.update(req.user.id, req.body));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

/**
 * Follow
 */
router.post('/:id/follow', async (req, res, next) => {
	try {
		res.send(await userController.toggleFollow(req.user.id, req.params.id));
	} catch (error) {
		console.error(error);
		next(error);
	}
});

/**
 * Copy
 */
router.post('/:id/copy', async (req, res, next) => {
	try {
		console.log('bitch cosadfasfasdfasdfasdfasdfpy');
		res.send(await userController.toggleCopy(req.user.id, req.params.id));
	} catch (error) {
		console.error(error);
		next(error);
	}
});


// /**
//  * Create
//  */
// router.post('/', async (req, res, next) => {
// 	try {
// 		console.log('USER POST!!!!!');
// 		res.send(await userController.create(req.body));
// 	} catch (error) {
// 		console.error(error);
// 		next(error);
// 	}
// });

export = router;