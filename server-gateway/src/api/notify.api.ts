import { Router } from 'express';
import * as request from 'request-promise';
import * as httpProxy from 'http-proxy';
import { userController } from '../controllers/user.controller';
import { deviceController } from '../controllers/device.controller';

const config = require('../../../tradejs.config');
const router = Router();

export = router;