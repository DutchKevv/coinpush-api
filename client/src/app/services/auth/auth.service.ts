import { EventEmitter, Injectable, Output } from '@angular/core';
import { AlertService } from "../alert.service";
import { LoginComponent } from '../../components/login/login.component';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ModalService } from '../modal/modal.service';
import { DeviceService } from '../device/device.service';
import { StorageService } from '../storage.service';
import { ConfigService } from '../config/config.service';
import { AccountService } from '../account/account.service';

declare const window: any;

const FB_APP_ID_PROD = '391706548256074';
const FB_APP_ID_DEV = '259397594955864';

@Injectable({
	providedIn: 'root',
})
export class AuthService {

	@Output() public loggedIn$: EventEmitter<boolean> = new EventEmitter(false);

	public loginOpen = false; // needed to prevent 401 request opening multiple login popups

	constructor(
		private _alertService: AlertService,
		private _modalService: ModalService,
		private _activetedRoute: ActivatedRoute,
		private _deviceService: DeviceService,
		private _storageService: StorageService,
		private _configService: ConfigService,
		private _accountService: AccountService,
		private _http: HttpClient) {
		this.init();
	}

	init() {
		this._activetedRoute.queryParamMap
			// .distinctUntilChanged()
			.subscribe((params: any) => {
				for (let key in params.params) {
					switch (key) {
						case 'loginRoute':
							this.showLoginRegisterPopup(params.params.loginRoute);
							break;
					}
				}
			});
	}

	public async requestPasswordReset(email: string): Promise<boolean> {
		let result = false;

		try {
			<any>await this._http.post('/authenticate/request-password-reset', { email }).toPromise();
			this._alertService.success(`Email send to: ${email}`);
			result = true;
		} catch (error) {
			console.error(error);
			this._alertService.error(`An error occured`);
		}

		return result;
	}

	public async updatePassword(token: string, password: string): Promise<boolean> {
		let result = false;

		try {
			result = <any>await this._http.put('/authenticate', { token, password }).toPromise();
			this._alertService.success(`Password has been updated`);
			result = true;
		} catch (error) {
			console.error(error);
			this._alertService.error(`An error occured`);
		}

		return result;
	}

	/**
	 * 
	 * @param email 
	 * @param password 
	 * @param token 
	 * @param profile 
	 * @param reload 
	 */
	async authenticate(email?: string, password?: string, token?: string, loadProfile = false, reload = false, redirectUrl?: string): Promise<boolean> {
		if (!email && !password && !token) {
			token = this._accountService.account$.getValue().token;

			if (!token) {
				return false;
			}
		}

		if (email) {
			email = email.toLowerCase().trim();
		}

		const postData = {
			email,
			password,
			token
		};

		try {
			const params = new HttpParams({
				fromObject: { profile: loadProfile.toString(), redirectUrl },
			});

			const result = <any>await this._http.post('/authenticate', postData, { params }).toPromise();

			if (!result.user || !result.user.token) {
				return false;
			}

			// does not save to server but updates persistant storage
			await this._accountService.update(result.user, false);
			await this._storageService.set('last-user-id', result.user._id);

			if (reload) {
				this.reload(redirectUrl);
			}

			return true;

		} catch (error) {
			if (error.status) {
				console.log(error.status);
				switch (error.status) {
					case 401:
						this._alertService.error('Invalid credentials');
						break;
					case 500:
						this._alertService.error('Server error');
						break;
					default:
						this._alertService.error('Unknown error');
				}
			} else {
				console.error(error);
			}

			return false;
		}
	}

	public authenticateFacebook(emailAddress?: string, redirectUrl?: string): Promise<any> {

		return new Promise((resolve, reject) => {
			const scope = ['email', 'public_profile'];
			// const scope = 'email,public_profile,user_location,user_birthday';

			if (emailAddress) {
				emailAddress = emailAddress.toLowerCase().trim();
			}

			// app
			if (this._configService.platform.isApp) {
				// login through cordova facebook plugin
				window.facebookConnectPlugin.login(scope, async (response) => {

					// get facebook unique accessToken
					const token = response.authResponse.accessToken;

					if (token) {
						try {
							// login add coinpush server with accessToken
							const authResult = <any>await this._http.post(`/authenticate/facebook`, { token, email: emailAddress }).toPromise();

							if (authResult && authResult.token) {

								// store token and _id locally
								await this._accountService.update({ _id: authResult._id, token: authResult.token }, true);

								// reload app
								this.reload(redirectUrl);
							} else {
								reject('token missing');
							}
						} catch (error) {
							return reject(error)
						}

					} else {
						reject('inpcomplete response')
					}
				}, (error) => {
					reject(error);
				});


			}

			// browser
			else {
				/** TODO - TODO - TODO - TODO
				 * Cordova facebook plugins cannot handle multiple facebook account settings 
				 * 
				 * Still looking for a way without cordova plugins...
				 * 
				 * So for now using always prod
				 **/
				const clientId = environment.production ? FB_APP_ID_PROD : FB_APP_ID_DEV;
				// const clientId = FB_APP_ID_PROD;

				const fbRedirectUrl = environment.production ? 'https://www.coinpush.app/index.redirect.facebook.html' : 'http://localhost:4200/index.redirect.facebook.html';
				const loginUrl = `https://graph.facebook.com/oauth/authorize?client_id=${clientId}&response_type=token&redirect_uri=${fbRedirectUrl}&scope=${scope.join()}`;

				window.addEventListener('message', async (message: any) => {
					if (message.data.error)
						return reject(message.error);

					try {
						const authData = { token: message.data.token, email: emailAddress };
						const user = <any>await this._http.post(`/authenticate/facebook`, authData).toPromise();

						if (user && user.token) {
							await this._accountService.update(user, true);
							this.reload(redirectUrl);
						} else {
							reject('inpcomplete response')
						}
					} catch (error) {
						reject(error)
					}

				}, { once: true });

				const fbWindow = window.open(loginUrl, '_system');

				fbWindow.focus();
			}
		});
	}

	public async logout(): Promise<void> {
		try {
			await this._deviceService.remove();
		} catch (error) {
			console.error(error);
		}

		try {
			await this._storageService.clearProfile(this._accountService.account$.getValue()._id);
		} catch (error) {
			console.error(error);
		}

		this.reload();
	}

	public async showLoginRegisterPopup(activeForm?: string, redirectUrl?: string) {
		const dialog = this._modalService.open({
			component: LoginComponent
		});

		dialog.beforeClose().subscribe(() => {
		
		});

		// const modalRef = this._modalService.open(LoginComponent);
		// if (activeForm) {
		// 	modalRef.componentInstance.activeFormType = activeForm;
		// }

		// modalRef.componentInstance.redirectUrl = redirectUrl;

		// this.loginOpen = true;
	}

	public reload(redirectUrl?: string) {
		if (this._configService.platform.isApp) {
			window.location = 'index.html' + (redirectUrl ? `#${redirectUrl}` : '');
		} else {
			if (redirectUrl)
				window.location = '#' + redirectUrl;

			window.location.reload();
		}
	}

	private _getDeviceToken() {
		return new Promise((resolve, reject) => {
			if (!window['app'].platform.isApp)
				return resolve();

			window['FirebasePlugin'].getToken(token => {
				if (!token)
					return reject('No device token found!');

				resolve(token);
			});
		});
	}


	/**
	 * Only required in Cordova
	 */
	private _listenToTokenRefresh() {
		if (!window['app'].platform.isApp)
			return;

		window['FirebasePlugin'].onTokenRefresh(token => this._syncDeviceToken(token));
	}

	private _syncDeviceToken(token: string): void {

	}
}