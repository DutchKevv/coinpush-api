import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {UserModel} from '../models/user.model';
import {USER_FETCH_TYPE_ACCOUNT_DETAILS} from '../../../shared/constants/constants';

@Injectable()
export class StartupService {

	public loggedInUser: UserModel = new UserModel(JSON.parse(localStorage.getItem('currentUser') || '{}'));

	constructor(private _http: Http) {
	}

	load(): Promise<any> {

		return this._http.get('/user/' + this.loggedInUser.get('_id') || '', {params: {type: USER_FETCH_TYPE_ACCOUNT_DETAILS}})
			.map((res) => {
				this.loggedInUser.set(res.json());
			})
			.toPromise()
			.catch((err: any) => {
				return Promise.resolve(null);
			});
	}
}