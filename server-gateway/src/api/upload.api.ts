import {Router} from 'express';
import * as multer from 'multer';
import {join, extname} from 'path';
import {channelController} from '../controllers/channel.controller';
const config = require('../../../tradejs.config');

const router = Router();

// set the directory for the uploads to the uploaded to
const DIR = join(__dirname, '..', '..', '..', 'images', 'images', 'profile');

const storage = multer.diskStorage({
	destination: DIR,
	filename: function (req, file, cb) {
		cb(null, req.user.id + '_' + Date.now() + extname(file.originalname));
	}
});

const upload = multer({storage: storage});

function normalizeProfileImg(filename) {
	if (filename) {
		if (filename.indexOf('http://') > -1)
			return filename;

		return join(config.image.profileBaseUrl,  filename);
	}
	else
		return config.image.profileDefaultUrl;
};

router.post('/profile', upload.single('image'), async (req: any, res, next) => {

	try {
		const result = await channelController.updateByUserId(req.user, req.user.id, {profileImg: req.file.filename});
		console.log('asdfsadfsdfads', result);

		res.send({url: normalizeProfileImg(req.file.filename)});
	} catch (error) {
		console.log(error);
		next(error);
	}
});

export = router;