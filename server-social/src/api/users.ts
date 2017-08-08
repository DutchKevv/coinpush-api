import {Router} from 'express';
import {User} from '../schemas/user';

const router = Router();

router.get('/', async function (req: any, res) {
	const data = await Promise.all([User.find({}).limit(50), User.findById(req.user.id)]);

	const following = data[1].following;

	data[0].forEach((user, i) => {
		if (!user.profileImg)
			user.profileImg = 'http://localhost/images/default/profile/nl.png';

		data[0][i] = user = user.toObject();
		user.follow = following.includes(user._id.toString());
	});

	res.send(data[0]);
});

export = router;