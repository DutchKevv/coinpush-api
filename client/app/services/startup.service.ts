import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {UserModel} from '../models/user.model';

@Injectable()
export class StartupService {

	private loggedInUser: UserModel = new UserModel();
	private baseApiUrl: string;

	constructor(
		private _http: Http) {
	}

	load(): Promise<any> {
		this.loggedInUser = new UserModel();

		return this._http.get('/social/user', {body: {type: 2}})
			.map((res) => {
				this.loggedInUser.set(res.json());
			})
			.toPromise()
			.catch((err: any) => {
				return Promise.resolve(null);
			});
	}

	get getLoggedInUser(): any {
		return this.loggedInUser;
	}
}