import * as request from 'request-promise';

const config = require('../../../tradejs.config.js');

export const cacheController = {

	find(reqUser, params): Promise<Array<any>> {
        return request({
            uri: config.server.cache.apiUrl + '/cache',
            headers: {
                _id: reqUser.id
            },
            qs: params
        });
    }
};