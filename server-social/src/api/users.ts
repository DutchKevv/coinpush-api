import {Router} from 'express';
import {User} from '../schemas/user';

const router = Router();

router.get('/', async function (req: any, res) {
	const data = await Promise.all([User.find({}).limit(50), User.findById(req.user.id)]);

	const following = data[1].following;

	data[0].forEach((user, i) => {
		if (!user.profileImg)
			user.profileImg = 'http://localhost/images/defaults/profile/nl.png';

		data[0][i] = user = user.toObject();
		user.follow = following.includes(user._id.toString());
	});

	res.send(data[0]);
});

router.post('/', (req, res) => {

	let userData = {
		email: req.body.email,
		username: req.body.username,
		password: req.body.password,
		passwordConf: req.body.passwordConf
	};

	if (!userData.email || !userData.username || !userData.password || !userData.passwordConf)
		return res.status(400).send('Missing attributes');

	// use schema.create to insert data into the db
	User.create(userData, function (err, user) {
		if (err) {
			res.status(500).send(err);
			console.error(err);
		} else {
			console.log('User created', user);
			res.send(user);
		}
	});
});

router.get('/:id', function (req, res, next) {

	User.findById(req.params.id)
		.exec(function (error, user) {
			if (error) {
				return next(error);
			} else {
				if (user === null) {
					const err = new Error('Not authorized! Go back!');
					err['status'] = 400;
					return next(err);
				} else {
					return res.send('<h1>Name: </h1>' + user.username + '<h2>Mail: </h2>' + user.email + '<br><a type="button" href="/logout">Logout</a>')
				}
			}
		});
});

router.post('/follow/:id', function (req: any, res, next) {

	User.follow(req.user.id, req.params.id, error => {
		if (error)
			return next(error);

		res.status(200).end();
	});
});

router.post('/un-follow/:id', function (req: any, res, next) {

	User.unFollow(req.user.id, req.params.id, error => {
		if (error)
			return next(error);

		res.status(200).end();
	});
});

export = router;