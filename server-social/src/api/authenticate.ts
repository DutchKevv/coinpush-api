import {Router} from 'express';
import {User} from '../schemas/user';

const router = Router();

router.get('/', function (req, res, next) {
	console.log(req.params);

	User.statics.authenticate({}, function (err, users) {
		if (err)
			return next(err);

		res.send(users);
	});
});

router.post('/', (req, res, next) => {
	// console.log(req.body);

	if (!req.body.username || !req.body.password)
		return res.status(400).send('Username or password is incorrect');

	User.authenticate(req.body.username, req.body.password, req.body.token, (err, result) => {
		if (err) {
			console.error(err);
			return res.status(500).send('Error');
		}

		if (!result)
			return res.status(400).send('Username or password is incorrect');

		res.send(result);
	});
});

export = router;