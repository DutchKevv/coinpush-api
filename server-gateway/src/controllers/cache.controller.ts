import * as request from 'request-promise';

const config = require('../../../tradejs.config');

export const cacheController = {

	find(reqUser, params): Promise<Array<any>> {
        return request({
            uri: config.server.cache.apiUrl + '/cache',
            encoding: null,
            headers: {
                'content-type' : 'application/octet-stream',
                _id: reqUser.id
            },
            qs: params
        });
    }
};