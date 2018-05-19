import { Router } from 'express';
import * as multer from 'multer';
import * as sharp from 'sharp';
import * as request from 'requestretry';
import * as fs from 'fs';
import { join, extname } from 'path';
import { userController } from '../controllers/user.controller';
import { G_ERROR_MAX_SIZE } from 'coinpush/constant';
import { IReqUser } from 'coinpush/interface/IReqUser.interface';

const config = require('../../../tradejs.config.js');

const upload = multer({ storage: multer.memoryStorage({}) });
export const router = Router();

function normalizeProfileImg(filename) {
	if (filename) {
		if (filename.indexOf('http://') > -1)
			return filename;

		return join(config.image.profileBaseUrl, filename);
	}
	else
		return config.image.profileDefaultUrl;
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
		const fullPath = join(config.image.profilePath, fileName);

		// resize and save
		await sharp(req.file.buffer).resize(1000).max().toFile(fullPath);

		// update user
		await userController.update(req.user, req.user.id, { img: fileName });

		// return full img url to client
		res.send({ url: fileName });
	} catch (error) {
		console.error(error);
		next(error);
	}
});

export function downloadProfileImgFromUrl(reqUser: IReqUser, url: string): Promise<string> {
	const fileName = reqUser.id + '_' + Date.now() + '.png';
	const fullPath = join(config.image.profilePath, fileName);
	const resizeTransform = sharp().resize(1000).max();

	return new Promise((resolve, reject) => {
		request(url)
			.pipe(resizeTransform)
			.pipe(fs.createWriteStream(fullPath))
			.on('close', () => resolve(fileName))
			.on('error', reject);
	});
}

// export = router;