import * as url from 'url';
import * as request from 'request-promise';
import * as redis from '../modules/redis';
import {REDIS_USER_PREFIX} from '../../../shared/constants/constants';
import { userController } from './user.controller';

const config = require('../../../tradejs.config');

export const userOverviewController = {

	getOverview(reqUser, params?): Promise<any> {
		return userController.findMany(reqUser, params);
	}
};