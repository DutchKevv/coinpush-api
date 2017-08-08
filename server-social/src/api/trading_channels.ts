import {Router} from 'express';
import {TradingChannel} from '../schemas/trading_channel';

const router = Router();

router.get('/', function (req, res, next) {
	console.log(req.params);

	TradingChannel.find({}, function (err, channels) {
		if (err)
			return next(err);

		res.send(channels);
	});
});

router.post('/', (req, res, next) => {

	if (req.body.username && req.body.password && req.body.passwordConf) {

		let userData = {
			email: req.body.email,
			username: req.body.username,
			password: req.body.password,
			passwordConf: req.body.passwordConf
		};

		// use schema.create to insert data into the db
		TradingChannel.create(userData, function (err, channel) {
			if (err) {
				// return next(err)
				console.error(err);
			} else {
				return res.redirect('/profile');
			}
		});
	}
});

router.get('/:id', function (req, res, next) {
	console.log(req.params);

	TradingChannel.findById(req.params.id)
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

export = router;