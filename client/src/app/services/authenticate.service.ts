import { EventEmitter, Injectable, Output } from '@angular/core';
import { UserService } from './user.service';
import { AlertService } from "./alert.service";
import { LoginComponent } from '../components/login/login.component';
import { app } from '../../core/app';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../../environments/environment';
import { CustomHttp } from './http.service';
import { HttpClient, HttpParams } from '@angular/common/http';

declare const window: any;

const FB_APP_ID_PROD = '178901869390909';
const FB_APP_ID_DEV = '162805194523993';

@Injectable()
export class AuthenticationService {

	@Output() public loggedIn$: EventEmitter<boolean> = new EventEmitter(false);
	public loggedIn: boolean = false;
	public loginOpen = false; // needed to prevent 401 request opening multiple login popups

	constructor(
		private _userService: UserService,
		private _alertService: AlertService,
		private _modalService: NgbModal,
		private _http: HttpClient) {
		this.init();
	}

	init() {
		app.on('firebase-token-refresh', () => this.saveDevice());
	}

	public async requestPasswordReset(email: string) {
		const result = <any>await this._http.post('/authenticate/request-password-reset', { email }).toPromise();

		if (result.status === 200)
			this._alertService.success(`Email send to: ${email}`);
		else
			this._alertService.error(`An error occured`);

		return result;
	}

	public async updatePassword(token: string, password: string) {
		const result = <any>await this._http.put('/authenticate', { token, password }).toPromise();

		if (result.status === 200)
			this._alertService.success('Your password has been reset');
		else
			this._alertService.error('An error occurred...');

		return result.status === 200;
	}

	async authenticate(email?: string, password?: string, token?: string, profile = false, reload = false): Promise<boolean> {
		if (!email && !password && !token) {
			token = app.user.token;

			if (!token) {
				return false;
			}
		}

		const postData = {
			email,
			password,
			token
		};

		try {
			const params = new HttpParams({
				fromObject: { profile: '0' }
			});

			const result = <any>await this._http.post('/authenticate', postData, { params }).toPromise();

			if (!result.user || !result.user.token) {
				return false;
			}

			// does not save to server but updates persistant storage
			await this._userService.update(result.user, false, false);

			if (reload)
				window.location.reload();

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

	public authenticateFacebook(): Promise<any> {
		return new Promise((resolve, reject) => {
			const clientId = environment.production ? FB_APP_ID_PROD : FB_APP_ID_DEV;
			const scope = 'email,public_profile,user_location,user_birthday,user_about_me';
			const redirectUrl = (environment.production ? 'https://frontend-freelance.com' : 'http://localhost:4000') + '/index.redirect.facebook.html';
			const loginUrl = `//graph.facebook.com/oauth/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirectUrl}&scope=${scope}`;

			const self = this;
			window.addEventListener('message', async function cb(message) {
				window.removeEventListener('message', cb, false);

				if (message.data.error)
					return reject(message.error);

				const authResult = <any>await self._http.post(`/authenticate/facebook`, { token: message.data.token }).toPromise();

				if (authResult && authResult.token) {
					await self._userService.update({ token: authResult.token }, false, false);
					window.location.reload();
				}
			}, false);

			const fbWindow = window.open(loginUrl, "fbLogin");
			fbWindow.focus();
		});
	}

	public async saveDevice() {
		// only continue if user is loggedin
		if (!this._userService.model.options._id)
			return;

		await this._http.post('/device', {
			token: app.notification.token,
			platformType: app.platform.isApp ? 'app' : 'browser'
		}).toPromise();
	}

	public async removeDevice() {
		// only continue if user is loggedin
		if (!this._userService.model.options._id)
			return;

		await this._http.delete('/device/' + app.notification.token).toPromise();
	}

	public async logout(): Promise<void> {
		await app.removeStoredUser();
		window.location = window.location.origin;
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

	public async showLoginRegisterPopup() {
		if (this.loginOpen)
			return;

		const modalRef = this._modalService.open(LoginComponent);
		modalRef.componentInstance.name = 'World';
		this.loginOpen = true;
	}

	public async showForgotPasswordPopup() {

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