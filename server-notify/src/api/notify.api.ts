import { Router } from 'express';
import { emailController } from '../controllers/email.controller';
import { notifyController } from '../controllers/notify.controller';
import { userController } from '../controllers/user.controller';

const router = Router();

/**
 * get unread count
 */
router.get('/unread', async (req: any, res, next) => {
	try {
		const result = await userController.getUnreadCount(req.user);
		res.send(result.toString());
	} catch (error) {
		next(error);
	}
});

/**
 * get single
 */
router.get('/:id', async (req: any, res, next) => {
	try {
		res.send(await notifyController.findById(req.user, req.params.id));
	} catch (error) {
		next(error);
	}
});

/**
 * get list
 */
router.get('/', async (req: any, res, next) => {
	try {
		res.send(await notifyController.findMany(req.user, req.query));
	} catch (error) {
		next(error);
	}
});

/**
 * update unread
 */
router.put('/unread/:id', async (req: any, res, next) => {
	try {
		res.send(await notifyController.markUnread(req.user, req.params.id));
	} catch (error) {
		next(error);
	}
});

/**
 * update all unread
 */
router.put('/unread', async (req: any, res, next) => {
	try {
		res.send(await notifyController.markAllUnread(req.user));
	} catch (error) {
		next(error);
	}
});

/**
 * reset unread counter to 0
 */
router.put('/reset-unread-counter', async (req: any, res, next) => {
	try {
		res.send(await notifyController.resetUnreadCount(req.user));
	} catch (error) {
		next(error);
	}
});

export = router;