import {Router} from 'express';
import { eventController } from '../controllers/event.controller';

const config = require('../../../coinpush.config.js');

const router = Router();

/**
 * get app config
 */
router.get('/', function (req: any, res, next) {
    res.send(config.app);
});


export = router;