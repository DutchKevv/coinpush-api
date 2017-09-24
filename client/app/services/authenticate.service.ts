import {Injectable} from '@angular/core';
import {Http, Response} from '@angular/http';
import 'rxjs/add/operator/map'
import {Router} from '@angular/router';
import {UserService} from './user.service';

@Injectable()
export class AuthenticationService {

	constructor(
		private router: Router,
		private http: Http,
		private _userService: UserService) {
	}

	init() {}

	getToken() {
		return localStorage.getItem('currentUser');
	}

	removeToken() {
		localStorage.removeItem('currentUser');
	}

	login(email: string, password: string) {
		return this.authenticateAndLoadUserData(email, password);
	}

	authenticateAndLoadUserData(email: string, password: string, token?: string) {
		return this.http.post('/authenticate', {email, password, token})
			.map((response: Response) => {
				// login successful if there's a jwt token in the response
				let user = response.json();
				if (user && user.token) {
					// store user details and jwt token in local storage to keep user logged in between page refreshes
					localStorage.setItem('currentUser', JSON.stringify(user));
				}

				this._userService.model.set(user);

				return user;
			});
	}

	logout() {
		// remove user from local storage to log user out
		this.removeToken();
		this.router.navigate(['/login']);
	}
}