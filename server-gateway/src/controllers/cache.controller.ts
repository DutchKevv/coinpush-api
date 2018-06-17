import * as request from 'request-promise';
import { config } from 'coinpush/src/util/util-config';

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