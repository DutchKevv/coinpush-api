import * as request from 'request-promise';
import { FB, FacebookApiException } from 'fb';
import { userController } from "./user.controller";
import { G_ERROR_UNKNOWN } from "coinpush/constant";
import { log } from 'coinpush/util/util.log';
import { IUser } from 'coinpush/interface/IUser.interface';
import { genderStringToConstant } from 'coinpush/util/util.convert';
import { deviceController } from './device.controller';
import { symbolController } from './symbol.controller';
import { IReqUser } from 'coinpush/interface/IReqUser.interface';
import { notifyController } from './notify.controller';
import { eventController } from './event.controller';

const config = require('../../../tradejs.config.js');

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
			symbols: results[0],
			notifications: {
				unreadCount: userData[0]
			},
			events: userData[1],
			user
		};
	},

	async authenticateFacebook(reqUser: IReqUser, params: { token: string } = { token: undefined }) {
		const facebookProfile = await FB.api('me', { fields: ['id', 'name', 'email', 'gender', 'locale'], access_token: params.token });

		if (facebookProfile && facebookProfile.id) {
			// search in DB for user with facebookId
			let user = (await userController.findByFacebookId(reqUser, facebookProfile.id))[0];

			// create new user if not founds
			if (!user) {
				user = await userController.create({}, {
					email: facebookProfile.email,
					name: facebookProfile.name,
					// description: facebookProfile.about,
					gender: genderStringToConstant(facebookProfile.gender),
					country: facebookProfile.locale.split('_')[1],
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
		}

		// handle error
		if (facebookProfile && facebookProfile.error) {
			if (facebookProfile.error.code === 'ETIMEDOUT') {
				console.log('request timeout');
			}
			else {
				console.log('error', facebookProfile.error);
			}
		}
		else {
			console.log('asdf', facebookProfile);
			throw new Error('Invalid facebook response');
		}
	},

	async requestPasswordReset(reqUser, email: string): Promise<void> {
		let user;

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
