import { Router } from 'express';
import * as multer from 'multer';
import * as sharp from 'sharp';
import * as fs from 'fs';
import { join, extname } from 'path';
import { userController } from '../controllers/user.controller';
import { G_ERROR_MAX_SIZE } from '../../../shared/constants/constants';
const config = require('../../../tradejs.config');

const router = Router();

const IMAGE_DIR = join(__dirname, '..', '..', '..', 'images', 'images', 'profile');
const domainPrefix = 'http://' + (process.env.NODE_ENV === 'production' ? config.ip.prod : config.ip.local) + ':' + config.port;

const upload = multer({ storage: multer.memoryStorage({}) });

function normalizeProfileImg(filename) {
	if (filename) {
		if (filename.indexOf('http://') > -1)
			return filename;

		return domainPrefix + join(config.image.profileBaseUrl, filename);
	}
	else
		return domainPrefix + config.image.profileDefaultUrl;
};

router.post('/profile', upload.single('image'), async (req: any, res, next) => {

	try {
		// Check max file size (in bytes)
		if (req.file.size > config.image.maxUploadSize)
			throw ({
				code: G_ERROR_MAX_SIZE,
				message: 'max file size is 10MB' // TODO hardcoded text
			});

		const fileName = req.user.id + '_' + Date.now() + extname(req.file.originalname);
		const fullPath = join(IMAGE_DIR, fileName);

		// resize and save
		await sharp(req.file.buffer).resize(1000).max().toFile(fullPath);

		// update user
		await userController.update(req.user, req.user.id, { img: fileName });

		// return full img url to client
		res.send({ url: normalizeProfileImg(fileName) });
	} catch (error) {
		next(error);
	}
});

export = router;