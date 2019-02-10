import * as multer from 'multer';
import * as sharp from 'sharp';
import * as request from 'requestretry';
import * as fs from 'fs';
import * as path from 'path';
import { Router } from 'express';
import { join, extname } from 'path';
import { userController } from '../controllers/user.controller';
import { G_ERROR_MAX_SIZE } from 'coinpush/src/constant';
import { IReqUser } from 'coinpush/src/interface/IReqUser.interface';
import { config } from 'coinpush/src/util/util-config';

export const router = Router();
const upload = multer({ dest: path.join(__dirname, '../../.tmp/') });

const CDN_URL = process.env.NODE_ENV.startsWith('prod') ? 'https://www.static.coinpush.app:4300' : 'http://host.docker.internal:4300'

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

		await request(`${CDN_URL}/upload`, {
			method: 'post',
			formData: {
				fileName: fileName,
				image: fs.createReadStream(req.file.path)
			}
		});

		// update user @ DB
		await userController.update(req.user, req.user.id, { img: fileName });

		// return img url
		res.send({ url: fileName });
	} catch (error) {
		console.error(error);
		next(error);
	}
});

export function downloadProfileImgFromUrl(reqUser: IReqUser, url: string): Promise<string> {
	const fileName = reqUser.id + '_' + Date.now() + '.png';
	const fullPath = join(config.image.profilePath, fileName);
	const resizeTransform = sharp().resize(1000);

	return new Promise((resolve, reject) => {
		request(url)
			.pipe(resizeTransform)
			.pipe(fs.createWriteStream(fullPath))
			.on('close', () => resolve(fileName))
			.on('error', reject);
	});
}