import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {UserModel} from '../models/user.model';

@Injectable()
export class StartupService {

	private _loggedInUser: UserModel = new UserModel(JSON.parse(localStorage.getItem('currentUser') || '{}'));
	private baseApiUrl: string;

	constructor(private _http: Http) {
	}

	load(): Promise<any> {
		this._loggedInUser = new UserModel(JSON.parse(localStorage.getItem('currentUser') || '{}'));

		return this._http.get('/social/user/' + this._loggedInUser.get('_id') || '', {body: {type: 2}})
			.map((res) => {
				this._loggedInUser.set(res.json());
			})
			.toPromise()
			.catch((err: any) => {
				return Promise.resolve(null);
			});
	}

	get getLoggedInUser(): any {
		return this._loggedInUser;
	}
}