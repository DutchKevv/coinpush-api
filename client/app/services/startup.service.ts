import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {UserModel} from '../models/user.model';
import {USER_FETCH_TYPE_ACCOUNT_DETAILS} from '../../../shared/constants/constants';

@Injectable()
export class StartupService {

	private _loggedInUser: UserModel = new UserModel(JSON.parse(localStorage.getItem('currentUser') || '{}'));
	private baseApiUrl: string;

	constructor(private _http: Http) {
	}

	load(): Promise<any> {
		this._loggedInUser = new UserModel(JSON.parse(localStorage.getItem('currentUser') || '{}'));

		return this._http.get('/user/' + this._loggedInUser.get('_id') || '', {params: {type: USER_FETCH_TYPE_ACCOUNT_DETAILS}})
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