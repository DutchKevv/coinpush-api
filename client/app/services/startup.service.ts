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
		const userId = this.loggedInUser.get('user_id');

		if (!userId)
			return Promise.resolve(null);


		return this._http.get('/user/' + userId || '', {params: {type: USER_FETCH_TYPE_ACCOUNT_DETAILS}})
			.map((res) => {
				this.loggedInUser.set(res.json());
			})
			.toPromise()
			.catch((err: any) => {
				return Promise.resolve(null);
			});
	}
}