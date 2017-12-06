import {Router} from 'express';
import * as multer from 'multer';
import {join, extname} from 'path';
import { userController } from '../controllers/user.controller';
const config = require('../../../tradejs.config');

const router = Router();

// set the directory for the uploads to the uploaded to
const DIR = join(__dirname, '..', '..', '..', 'images', 'images', 'profile');
const domainPrefix = 'http://' + (process.env.NODE_ENV === 'prod' ? config.ip.prod : config.ip.local) + ':' + config.port;

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

		return domainPrefix + join(config.image.profileBaseUrl,  filename);
	}
	else
		return domainPrefix + config.image.profileDefaultUrl;
};

router.post('/profile', upload.single('image'), async (req: any, res, next) => {

	try {
		const result = await userController.update(req.user, req.user.id, {img: req.file.filename});
		
		res.send({url: normalizeProfileImg(req.file.filename)});
	} catch (error) {
		console.log(error);
		next(error);
	}
});

export = router;