import {Router} from 'express';

const router = Router();

router.get('/:id', function (req, res, next) {
	console.log(req.query);
});

export = router;