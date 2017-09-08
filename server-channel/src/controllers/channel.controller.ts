import * as path from 'path';
import * as redis from '../modules/redis';

import {Candle, CandleSchema} from '../schemas/candle';

const config = require('../../../tradejs.config');

// import * as mkdirp      from '../../../shared/node_modules/mkdirp';
import {log} from '../../../shared/logger';

export const channelController = {

	async find(params: { symbol: string, timeFrame: string, from: number, until: number, count: number }) {

	},

	async findByUserId(id, publicOnly = true) {

	}
};