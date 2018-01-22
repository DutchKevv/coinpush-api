import { Router } from 'express';
import { cacheController } from "../controllers/cache.controller";
import { app } from '../app';

const router = Router();

/**
 * single
 */
router.get('/', async (req, res, next) => {
    try {
        res.write(await cacheController.find(req.query));
        res.end();
    } catch (error) {
        console.error(error);
        next(error);
    }
});

export = router;