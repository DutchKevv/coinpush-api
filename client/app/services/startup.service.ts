import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {UserModel} from '../models/user.model';
import {UserService} from './user.service';


@Injectable()
export class StartupService {

	private loggedInUser: UserModel = new UserModel();
	private baseApiUrl: string;

	constructor(
		private _http: Http) {
	}

	load(): Promise<any> {
		this.loggedInUser = new UserModel();

		let ret = this._http.get('/social/user', {body: {type: 2}})
			.map((res) => {
				this.loggedInUser.set(res.json());
			})
			.toPromise()
			.then((data: any) => {
				console.log('data', data)
			})
			.catch((err: any) => {
				console.log('catch');
				return Promise.resolve(null);
			});

		return ret.then((x) => {
			console.log('complete');
		});
	}

	get getLoggedInUser(): any {
		return this.loggedInUser;
	}
}