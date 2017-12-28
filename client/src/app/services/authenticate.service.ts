import { EventEmitter, Injectable, Output } from '@angular/core';
import { Http, Response } from '@angular/http';
import { UserService } from './user.service';
import { AlertService } from "./alert.service";
import { LoginComponent } from '../components/login/login.component';
import { app } from '../../assets/custom/js/core/app';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';


@Injectable()
export class AuthenticationService {

	@Output() public loggedIn$: EventEmitter<boolean> = new EventEmitter(false);

	constructor(private _userService: UserService,
		private _alertService: AlertService,
		private _modalService: NgbModal,
		private _http: Http) {
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
			const deviceToken = await this._getDeviceToken();

			const user = await this._http.post('/authenticate', {
				email,
				password,
				token,
				profile,
				device: {
					token: deviceToken
				}
			})
				.map((r: Response) => r.json())
				.toPromise();

			if (!user || !user.token) {
				return false;
			}

			await this._userService.update(user, false, false);

			if (reload)
				window.location.reload();

			return true;
		} catch (error) {
			console.error(error);
			return false;
		}
	}

	public async logout(): Promise<void> {
		if (this._userService.model.options._id) {
			await app.removeUser();
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
		const modalRef = this._modalService.open(LoginComponent);
		modalRef.componentInstance.name = 'World';
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