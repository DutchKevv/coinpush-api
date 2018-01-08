import { EventEmitter, Injectable, Output } from '@angular/core';
import { Http, Response } from '@angular/http';
import { UserService } from './user.service';
import { AlertService } from "./alert.service";
import { LoginComponent } from '../components/login/login.component';
import { app } from '../../core/app';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';


@Injectable()
export class AuthenticationService {

	@Output() public loggedIn$: EventEmitter<boolean> = new EventEmitter(false);
	public loginOpen = false; // needed to prevent 401 request opening multiple login popups

	constructor(private _userService: UserService,
		private _alertService: AlertService,
		private _modalService: NgbModal,
		private _http: Http) {
		app.on('firebase-token-refresh', () => this.updateDeviceToken());
	}

	public async requestPasswordReset(email: string) {
		const result = await this._http.post('/authenticate/request-password-reset', { email }).toPromise();

		if (result.status === 200)
			this._alertService.success(`Email send to: ${email}`);
		else
			this._alertService.error(`An error occured`);

		return result;
	}

	public async updatePassword(token: string, password: string) {
		const result = await this._http.put('/authenticate', { token, password }).toPromise();

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
				// this.logout();
				return false;
			}
		}

		try {
			const deviceToken = app.notification.token;

			const result = await this._http.post('/authenticate', {
				email,
				password,
				token,
				profile,
				device: {
					token: deviceToken,
					platformType: app.platform.isApp ? 'app' : 'browser'
				}
			})
				.map((r: Response) => r.json())
				.toPromise();

			if (!result.user || !result.user.token) {
				return false;
			}

			// does not save to server but updates localStorage
			await this._userService.update(result.user, false, false);

			if (reload)
				window.location.reload();
		} catch (error) {
			if (error.status) {
				switch (error.status) {
					case '401':
						this._alertService.error('Invalid credentials');
						break;
					case '500':
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

	public async updateDeviceToken() {
		// only continue if user is loggedin
		if (!this._userService.model.options._id)
			return;

		await this._http.post('/device', {
			token: app.notification.token,
			platformType: app.platform.isApp ? 'app' : 'browser'
		}).toPromise();
	}

	public async logout(): Promise<void> {
		if (this._userService.model.options._id) {
			await app.removeStoredUser();
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