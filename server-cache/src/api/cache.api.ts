import { Router } from 'express';
import { cacheController } from "../controllers/cache.controller";
import { app } from '../app';

const router = Router();

/**
 * single
 */
router.get('/', async (req, res, next) => {
    try {
        res.send(await cacheController.find(req.query));
    } catch (error) {
        console.error(error);
        next(error);
    }
});

export = router;