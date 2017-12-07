import {EventEmitter, Injectable, Output} from '@angular/core';
import {Http, Response} from '@angular/http';
import 'rxjs/add/operator/map'
import {Router} from '@angular/router';
import {UserService} from './user.service';
import {OrderService} from "./order.service";
import {CacheService} from "./cache.service";
import {SocketService} from "./socket.service";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {AlertService} from "./alert.service";
import { UserModel } from '../models/user.model';

@Injectable()
export class AuthenticationService {

	@Output() public loggedIn$: EventEmitter<boolean> = new EventEmitter(false);

	constructor(private _router: Router,
				private _userService: UserService,
				private _alertService: AlertService,
				private _http: Http) {
	}

	getStoredUser(): any {
		try {
			return JSON.parse(localStorage.getItem('currentUser'));
		} catch (err) {
			return null;
		}
	}

	getStoredToken() {
		const user = this.getStoredUser();

		if (user && user.token)
			return user.token;

		return null;
	}

	removeStoredUser(): void {
		localStorage.removeItem('currentUser');
	}

	isValidStoredUser() {
		const user = this.getStoredUser();

		return user && user.token;
	}

	public async requestPasswordReset(email: string) {
		const result = await this._http.post('/authenticate/request-password-reset', {email}).toPromise();

		if (result.status === 200)
			this._alertService.success(`Email send to: ${email}`);
		else
			this._alertService.error(`An error occured`);

		return result;
	}

	public async updatePassword(token: string, password: string) {
		const result = await this._http.put('/authenticate', {token, password}).toPromise();

		if (result.status === 200)
			this._alertService.success('Your password has been reset');
		else
			this._alertService.error('An error occurred...');

		return result.status === 200;
	}

	async authenticate(email?: string, password?: string, token?: string, profile = true): Promise<boolean> {
		if (!email && !password && !token) {
			token = this.getStoredToken();
			if (!token) {
				this.logout();
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
				this.logout();
				return false;
			}

			this._userService.update(user, false, false)

			this.loggedIn$.emit(true);

			return true;
		} catch (error) {
			console.error(error);
			this.logout();
			return false;
		}
	}

	logout(): void {
		this.removeStoredUser();
		this.loggedIn$.emit(false);

		// Stay on register page
		if (window.location.hash.startsWith('#/register')) {
				
		} else {
			this._userService.model = new UserModel();
			this._router.navigate(['/login']);
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