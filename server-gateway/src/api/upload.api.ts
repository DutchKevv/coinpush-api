import * as multer from 'multer';
import * as request from 'requestretry';
import * as fs from 'fs';
import * as path from 'path';
import { Router } from 'express';
import { extname } from 'path';
import { userController } from '../controllers/user.controller';
import { G_ERROR_MAX_SIZE } from 'coinpush/src/constant';
import { IReqUser } from 'coinpush/src/interface/IReqUser.interface';
import { config } from 'coinpush/src/util/util-config';

const PATH_TMP = path.join(__dirname, '../../.tmp/') ;
const CDN_URL = (process.env.NODE_ENV || '').startsWith('prod') ? 'http://136.144.181.63:4300' : 'http://host.docker.internal:4300';

export const router = Router();
const upload = multer({ dest: PATH_TMP });

/**
 * TODO - Refactor. use streams instead of temp file
 */
router.post('/profile', upload.single('image'), async (req: any, res, next) => {

	// check max file size (bytes)
	if (req.file.size > config.image.maxUploadSize) {
		return next({
			code: G_ERROR_MAX_SIZE,
			message: 'Max file size is : ' + Math.round(config.image.maxUploadSize / 1024 / 1024) + 'MB' // TODO hardcoded text
		});
	}

	try {
		// file name as stored on cdn
		const fileName = req.user.id + '_' + Date.now() + extname(req.file.originalname);

		// upload to cdn
		await request(`${CDN_URL}/upload`, {
			method: 'post',
			formData: {
				fileName: fileName,
				image: fs.createReadStream(req.file.path)
			}
		});

		// update user with new image in db
		await userController.update(req.user, req.user.id, { img: fileName });

		// return img url
		res.send({ url: fileName });
	} catch (error) {
		console.error(error);
		next(error);
	}
});

router.post('/comment', upload.single('image'), async (req: any, res, next) => {

	// check max file size (bytes)
	if (req.file.size > config.image.maxUploadSize) {
		return next({
			code: G_ERROR_MAX_SIZE,
			message: 'Max file size is : ' + Math.round(config.image.maxUploadSize / 1024 / 1024) + 'MB' // TODO hardcoded text
		});
	}

	try {
		// file name as stored on cdn
		const fileName = req.user.id + '_' + Date.now() + extname(req.file.originalname);

		// upload to cdn
		await request(`${CDN_URL}/upload`, {
			method: 'post',
			formData: {
				type: 'comment',
				fileName: fileName,
				image: fs.createReadStream(req.file.path)
			}
		});

		// update user with new image in db
		// await userController.update(req.user, req.user.id, { img: fileName });

		// return img url
		res.send({ url: fileName });
	} catch (error) {
		console.error(error);
		next(error);
	}
});

/**
 * TODO - Refactor. use streams instead of temp file
 * 
 * @param reqUser 
 * @param url 
 */
export function updateProfileImgFromUrl(reqUser: IReqUser, url: string): Promise<string> {

	return new Promise(async (resolve, reject) => {
		const fileName = reqUser.id + '_' + Date.now() + '.png';
		const fullPath = path.join(PATH_TMP, fileName);
		
		request(url)
			.pipe(fs.createWriteStream(fullPath))
			.on('close', () => {
				
				// upload to cdn
				request(`${CDN_URL}/upload`, {
					method: 'post',
					formData: {
						fileName: fileName,
						image: fs.createReadStream(fullPath)
					}
				})
				.then(() => userController.update(reqUser, reqUser.id, { img: fileName }))
				.then(() => resolve(fileName))
				.catch(reject);
			})
			.on('error', reject);
	});
}