import * as request from 'requestretry';
import { IReqUser } from 'coinpush/src/interface/IReqUser.interface';
import { IUser } from 'coinpush/src/interface/IUser.interface';
import { config } from 'coinpush/src/util/util-config';
import { Request } from 'request';

export const commentController = {

	async addUser(reqUser: IReqUser, params: IUser): Promise<IUser> {

		const user = await request({
			uri: config.server.comment.apiUrl + '/user',
			headers: { '_id': params._id },
			method: 'POST',
			body: params,
			json: true,
			fullResponse: false
		});

		return user;
	},

	async findById(reqUser: IReqUser, id: string, params: any = {}): Promise<any> {
		const result = await request({
			uri: config.server.comment.apiUrl + '/comment/' + id,
			headers: { '_id': reqUser.id },
			qs: params,
			json: true
		});

		return result;
	},

	async findByUserId(reqUser: IReqUser, params): Promise<any> {
		const result = await request({
			uri: config.server.comment.apiUrl + '/comment/',
			headers: { '_id': reqUser.id },
			qs: params,
			json: true
		});

		return result;
	},

	async findMany(reqUser: IReqUser, params): Promise<any> {
		const result = await request({
			uri: config.server.comment.apiUrl + '/comment/',
			headers: { '_id': reqUser.id },
			qs: params,
			json: true,
			fullResponse: false
		});

		return result;
	},

	create(reqUser: IReqUser, params): Request {
		return request({
			uri: config.server.comment.apiUrl + '/comment/',
			method: 'POST',
			headers: { '_id': reqUser.id },
			body: params,
			json: true,
			fullResponse: false
		});
	},

	toggleLike(reqUser: IReqUser, commentId): Request {
		return request({
			uri: config.server.comment.apiUrl + '/comment/like/' + commentId,
			method: 'POST',
			headers: { '_id': reqUser.id },
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