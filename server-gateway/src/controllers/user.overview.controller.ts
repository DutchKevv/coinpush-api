import * as url from 'url';
import * as request from 'request-promise';
import * as redis from '../modules/redis';
import {CHANNEL_TYPE_MAIN, REDIS_USER_PREFIX} from '../../../shared/constants/constants';
import {channelController} from './channel.controller';

const config = require('../../../tradejs.config');

export const userOverviewController = {

	getOverview(reqUser, params?): Promise<any> {
		return channelController.findMany(reqUser, params);
	}
};