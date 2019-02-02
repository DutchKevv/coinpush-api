import { Router } from 'express';
import * as multer from 'multer';
// import * as sharp from 'sharp';
import * as request from 'requestretry';
import * as fs from 'fs';
import { join, extname } from 'path';
import { userController } from '../controllers/user.controller';
import { G_ERROR_MAX_SIZE } from 'coinpush/src/constant';
import { IReqUser } from 'coinpush/src/interface/IReqUser.interface';
import { config } from 'coinpush/src/util/util-config';

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
	// Check max file size (in bytes)
	if (req.file.size > config.image.maxUploadSize) {
		return next({
			code: G_ERROR_MAX_SIZE,
			message: 'Max file size is : ' + Math.round(config.image.maxUploadSize / 1024 / 1024) + 'MB' // TODO hardcoded text
		});
	}

	try {
		const fileName = req.user.id + '_' + Date.now() + extname(req.file.originalname);
		const fullPath = join(config.image.profilePath, fileName);

		// resize / crop and save to disk
		// await sharp(req.file.buffer).resize(1000).max().toFile(fullPath);

		// update user @ DB
		await userController.update(req.user, req.user.id, { img: fileName });

		// send img url
		res.send({ url: fileName });
		
	} catch (error) {
		console.error(error);
		next(error);
	}
});

export function downloadProfileImgFromUrl(reqUser: IReqUser, url: string): Promise<string> {
	return Promise.resolve('');
	// const fileName = reqUser.id + '_' + Date.now() + '.png';
	// const fullPath = join(config.image.profilePath, fileName);
	// const resizeTransform = sharp().resize(1000).max();

	// return new Promise((resolve, reject) => {
	// 	request(url)
	// 		.pipe(resizeTransform)
	// 		.pipe(fs.createWriteStream(fullPath))
	// 		.on('close', () => resolve(fileName))
	// 		.on('error', reject);
	// });
}

// export = router;