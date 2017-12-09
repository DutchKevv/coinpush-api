import * as request from 'request-promise';
import {userController} from "./user.controller";
import { IReqUser } from '../../../shared/interfaces/IReqUser.interface';

const config = require('../../../tradejs.config');

export const commentController = {

	async findById(reqUser: IReqUser, id: string, params: any = {}): Promise<any> {
		const result = await request({
			uri: config.server.comment.apiUrl + '/comment/' + id ,
			headers: {'_id': reqUser.id},
			qs: params,
			json: true
		});

		return result;
	},

	async findByUserId(reqUser: IReqUser, params): Promise<any> {		
		const result = await request({
			uri: config.server.comment.apiUrl + '/comment/',
			headers: {'_id': reqUser.id},
			qs: params,
			json: true
		});

		return result;
	},

	async create(reqUser: IReqUser, params): Promise<any> {
		return request({
			uri: config.server.comment.apiUrl + '/comment/',
			method: 'POST',
			headers: {'_id': reqUser.id},
			body: params,
			json: true
		});
	},

	toggleLike(reqUser: IReqUser, commentId): Promise<any> {
		return request({
			uri: config.server.comment.apiUrl + '/comment/like/' + commentId,
			method: 'POST',
			headers: {'_id': reqUser.id},
			json: true
		});
	},

	update(reqUser: IReqUser, commentId, params): Promise<any> {
		return Promise.resolve();
	},

	remove(reqUser, commentId): Promise<any> {
		return Promise.resolve();
	}
};