import {Injectable} from '@angular/core';
import {Http, Response} from '@angular/http';
import 'rxjs/add/operator/map'
import {Router} from '@angular/router';

@Injectable()
export class AuthenticationService {

	constructor(private router: Router, private http: Http) {
	}

	login(username: string, password: string) {
		return this.http.post('/social/authenticate', {username: username, password: password})
			.map((response: Response) => {
				// login successful if there's a jwt token in the response
				let user = response.json();
				if (user && user.token) {
					// store user details and jwt token in local storage to keep user logged in between page refreshes
					localStorage.setItem('currentUser', JSON.stringify(user));
				}

				return user;
			});
	}

	logout() {
		// remove user from local storage to log user out
		localStorage.removeItem('currentUser');
		this.router.navigate(['/login']);
	}
}