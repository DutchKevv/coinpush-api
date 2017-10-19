import {Injectable, Output} from '@angular/core';
import {Http, Response} from '@angular/http';
import 'rxjs/add/operator/map'
import {Router} from '@angular/router';
import {UserService} from './user.service';
import {OrderService} from "./order.service";
import {CacheService} from "./cache.service";
import {SocketService} from "./socket.service";
import {BehaviorSubject} from "rxjs/BehaviorSubject";

@Injectable()
export class AuthenticationService {

	@Output() public loggedIn$: BehaviorSubject<boolean> = new BehaviorSubject(false);

	constructor(private _router: Router,
				private _userService: UserService,
				private _cacheService: CacheService,
				private _orderService: OrderService,
				private _socketService: SocketService,
				private _http: Http) {
		this.authenticate();
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

	updateStoredUser(data): void {
		localStorage.setItem('currentUser', JSON.stringify(Object.assign(this.getStoredUser() || {}, data)));
	}

	removeStoredUser(): void {
		localStorage.removeItem('currentUser');
	}

	isValidStoredUser() {
		const user = this.getStoredUser();

		return user && user.token;
	}

	async authenticate(email?: string, password?: string, token?: string, profile = true): Promise<boolean> {
		if (!email && !password && !token) {
			token = this.getStoredToken();
			if (!token)
				return false;
		}

		try {
			const user = await this._http.post('/authenticate', {
				email,
				password,
				token,
				profile
			}).map((r: Response) => r.json()).toPromise();

			if (!user || !user.token)
				return false;

			this.updateStoredUser(user);

			this._userService.model.set(user);

			// await this.loadAppData();

			this.loggedIn$.next(true);

			return true;
		} catch (error) {
			return false;
		}
	}

	public async loadAppData() {
		this._socketService.connect();
		await this._cacheService.load();
		await this._orderService.load();
	}

	public async unloadAppData() {
		// this._socketService.disconnect();
	}

	logout() {
		this.removeStoredUser();
		this._router.navigate(['/login']);
	}
}