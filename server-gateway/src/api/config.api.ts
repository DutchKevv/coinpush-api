import {Router} from 'express';
import { eventController } from '../controllers/event.controller';
import { config } from 'coinpush/src/util/util-config';

const router = Router();

/**
 * get app config
 */
router.get('/', function (req: any, res, next) {
    res.send(config.app);
});


export = router;