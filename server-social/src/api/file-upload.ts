import {Router} from 'express';
import * as multer from 'multer';
import {join, extname} from 'path';
import {User} from '../schemas/user';
import {userController} from '../controllers/user.controller';

const router = Router();


// set the directory for the uploads to the uploaded to
const DIR = join(__dirname, '..', '..', '..', 'images', 'images', 'profile');

const storage = multer.diskStorage({
	destination: DIR,
	filename: function (req, file, cb) {
		cb(null, req.user.id + '_' + Date.now() + extname(file.originalname));
	}
});

const upload = multer({ storage: storage });

router.post('/profile', upload.single('image'), async (req: any, res, next) => {
	try {
		await userController.update(req.user.id, {profileImg: req.file.filename});
		res.send({url: User.normalizeProfileImg(req.file.filename)});
	} catch (error) {
		next(error);
	}
});

export = router;