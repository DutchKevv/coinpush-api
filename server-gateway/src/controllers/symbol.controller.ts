import * as request from 'request-promise';
import { client } from '../modules/redis';

const config = require('../../../tradejs.config');

export const symbolController = {

	getPublicList(): Promise<any> {
		return new Promise((resolve, reject) => {
            client.hgetall('symbols', (err, symbols) => {
                if (err)
                    return reject(err);

                resolve(symbols || []);
            });
        });
	}
};