import * as request from 'request-promise';
import {IReqUser} from '../../../shared/interfaces/IReqUser.interface';
import { IUser } from '../../../shared/interfaces/IUser.interface';
import { G_ERROR_USER_NOT_FOUND } from '../../../shared/constants/constants';

const config = require('../../../tradejs.config');

export const channelController = {

	findById(reqUser: IReqUser, channelId: string, options: any = {}): Promise<any> {
		return request({
			uri: config.server.channel.apiUrl + '/channel/' + channelId,
			headers: {'_id': reqUser.id},
			qs: options,
			json: true
		});
	},

	async findByUserId(reqUser: IReqUser, userId: string, options: any = {}): Promise<IUser> {
		const result = await request({
			uri: config.server.channel.apiUrl + '/channel/',
			headers: {'_id': reqUser.id},
			qs: {
				...options,
				user: userId
			},
			json: true
		});

		if (result && result.user && result.user[0])
			return result.user[0];

		return undefined;
	},

	findMany(reqUser: IReqUser, params: any = {}): Promise<Array<any>> {
		return request({
			uri: config.server.channel.apiUrl + '/channel',
			headers: {'_id': reqUser.id},
			qs: params,
			json: true
		});
	},

	create(reqUser: IReqUser, params: { name: string, type: number, description?: string, profileImg?: string }) {

		return request({
			uri: config.server.channel.apiUrl + '/channel/',
			method: 'POST',
			headers: {'_id': reqUser.id},
			body: params,
			json: true
		});
	},

	update(reqUser: IReqUser, channelId, params) {
		return request({
			uri: config.server.channel.apiUrl + '/channel/' + channelId,
			method: 'PUT',
			body: params,
			headers: {'_id': reqUser.id},
			json: true
		});
	},

	updateByUserId(reqUser: IReqUser, userId, params) {
		return request({
			uri: config.server.channel.apiUrl + '/user/' + userId,
			method: 'PUT',
			body: params,
			headers: {'_id': reqUser.id},
			json: true
		});
	},

	async toggleFollow(followerId: string, channelId: string) {
		const result = await request({
			uri: config.server.channel.apiUrl + '/channel/' + channelId + '/follow',
			method: 'POST',
			headers: {'_id': followerId},
			json: true
		});

		return result;
	},

	async toggleCopy(followerId: string, channelId: string) {
		const result = await request({
			uri: config.server.channel.apiUrl + '/channel/' + channelId + '/copy',
			method: 'POST',
			headers: {'_id': followerId},
			json: true
		});

		return result;
	},

	async addUser(reqUser: IReqUser, params: IUser, updateWhenPresent = undefined): Promise<any> {
		const channel = await request({
			uri: config.server.channel.apiUrl + '/user',
			headers: { '_id': reqUser.id },
			method: 'POST',
			body: {
				_id: params._id,
				name: params.name,
				profileImg: params.profileImg,
				description: params.description,
			},
			qs: {
				updateWhenPresent
			},
			json: true
		});

		return channel;
	},

	remove(reqUser: IReqUser, channelId) {

	}
};