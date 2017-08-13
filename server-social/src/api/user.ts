import {Router} from 'express';
import {User} from '../schemas/user';
import {userController} from '../controllers/user.controller';

const router = Router();

const getRootAllowedFields = ['_id', 'username', 'profileImg', 'country', 'followers', 'following', 'followersCount', 'followingCount'];
router.get('/', async function (req: any, res, next) {

	// Filter allowed fields
	const fields = {};
	(req.body.fields || []).filter(field => getRootAllowedFields.includes(field)).forEach(field => fields[field] = 1);

	try {
		res.send(await User.aggregate([
			{
				$project: {
					username: 1,
					// followersC: {$size: ['$followers']},
					// followingC: {$size: 'following'},
				}
			}
		], fields));
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

export = router;