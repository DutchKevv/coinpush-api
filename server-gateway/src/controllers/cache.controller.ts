import * as request from 'request-promise';
import { config } from 'coinpush/src/util/util-config';
import { IReqUser } from 'coinpush/src/interface/IReqUser.interface';

export const cacheController = {

	find(reqUser: IReqUser, params: any): Promise<Array<any>> {
        return request({
            uri: config.server.cache.apiUrl + '/cache',
            headers: {
                _id: reqUser.id
            },
            qs: params
        });
    }
};