import {Router} from 'express';
import {searchController} from '../controllers/search.controller';

const router = Router();

router.get('/:text', async function (req: any, res) {

	try {
		console.log(req.body);
		res.send(await searchController.search(req.params.text, req.query.limit));
	} catch (error) {
		res.status(500).send('Search error');
	}

});

export = router;