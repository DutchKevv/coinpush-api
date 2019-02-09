import * as request from 'request-promise';
import { FB } from 'fb';
import { userController } from "./user.controller";
import { G_ERROR_UNKNOWN } from "coinpush/src/constant";
import { log } from 'coinpush/src/util/util.log';
import { IUser } from 'coinpush/src/interface/IUser.interface';
import { genderStringToConstant } from 'coinpush/src/util/util.convert';
import { deviceController } from './device.controller';
import { symbolController } from './symbol.controller';
import { IReqUser } from 'coinpush/src/interface/IReqUser.interface';
import { notifyController } from './notify.controller';
import { eventController } from './event.controller';
import { config } from 'coinpush/src/util/util-config';
import { app } from '../index';

export const authenticateController = {

	async authenticate(reqUser: IReqUser, params: { email?: string, password?: string, token?: string, device?: any }, options: { profile?: boolean } = {}): Promise<any> {

		if (params.token) {
			if (reqUser.id && reqUser.id !== params.token)
				throw new Error('header token and param token do not match');
		} else {
			params.token = reqUser.id;
		}

		let user: IUser;
		let userData: any = [];

		const results = await Promise.all([
			symbolController.getPublicList(),
			(async () => {

				if (params.email || params.password || params.token) {
					if (options.profile) {
						params['fields'] = ['favorites', 'name', 'img'];
					}

					user = await request({
						uri: config.server.user.apiUrl + '/authenticate',
						headers: {
							_id: reqUser.id
						},
						method: 'POST',
						body: params,
						json: true
					});

					if (options.profile && user && user._id) {
						// get unread notification counter and active events (alarms)

						await new Promise((resolve, reject) => {
							let done = 0;

							notifyController.getUnreadCount({ id: user._id }).then(data => userData[0] = data).catch(console.error).finally(() => {
								if (++done === 2)
									resolve();
							});

							eventController.findMany({ id: user._id }).then(data => userData[1] = data).catch(console.error).finally(() => {
								if (++done === 2)
									resolve();
							});
						});
					}
				}
			})()
		]);

		return {
			config: app.clientConfig,
			symbols: results[0],
			notifications: {
				unreadCount: userData[0]
			},
			events: userData[1],
			user
		};
	},

	async authenticateFacebook(reqUser: IReqUser, params: { token: string, email?: string } = { token: undefined }) {
		let facebookProfile: any;

		try {
			const fields = ['id', 'name', 'email', 'gender', 'locale', 'location'];
			facebookProfile = await FB.api('me', { fields, access_token: params.token });
		} catch (error) {
			console.error(error);
			throw error;
		}

		let user = await request({
			uri: config.server.user.apiUrl + '/authenticate/facebook',
			headers: {
				_id: reqUser.id
			},
			method: 'POST',
			body: params,
			json: true
		});

		if (!user) {
			user = await userController.create({}, {
				email: facebookProfile.email || params.email,
				name: facebookProfile.name,
				// description: facebookProfile.about,
				gender: genderStringToConstant(facebookProfile.gender),
				country: facebookProfile.locale ? facebookProfile.locale.split('_')[1] : undefined,
				imgUrl: 'https://graph.facebook.com/' + facebookProfile.id + '/picture?width=1000',
				oauthFacebook: {
					id: facebookProfile.id
				}
			});
		}

		return {
			_id: user._id,
			token: user.token
		};
	},

	async requestPasswordReset(reqUser, email: string): Promise<void> {
		let user: IUser;

		try {
			user = await request({
				uri: config.server.user.apiUrl + '/authenticate/request-password-reset',
				headers: { '_id': reqUser.id },
				method: 'post',
				body: { email },
				json: true
			});
		} catch (error) {
			if (!error.error)
				throw ({ code: G_ERROR_UNKNOWN });

			return;
		}

		user.email = email;

		const result = await request({
			uri: config.server.notify.apiUrl + '/mail/request-password-reset',
			headers: { '_id': reqUser.id },
			method: 'POST',
			body: { user },
			json: true
		});

		console.log('reset', result);
	}
};
