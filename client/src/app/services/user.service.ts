import { Injectable, Output, Injector } from '@angular/core';
import { UserModel } from '../models/user.model';
import { AlertService } from './alert.service';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';

import { map } from 'rxjs/operators';
import { G_ERROR_DUPLICATE_FIELD } from 'coinpush/src/constant';
import { AccountService } from './account/account.service';

@Injectable({
	providedIn: 'root',
})
export class UserService {

	// public model: UserModel = new UserModel(Object.assign({
	// 	name: 'Anonymous'
	// }, {}));

	constructor(
		private _http: HttpClient,
		private _accountService: AccountService,
		private _alertService: AlertService) {
	}

	public findById(id: string, options: any = {}): Observable<UserModel> {
		const params = new HttpParams({
			fromObject: options
		});
		
		return this._http.get('/user/' + id, { params }).pipe(map((res: Response) => new UserModel(res)));
	}

	public getOverview(options: any = {}): Promise<Array<any>> {
		const params = new HttpParams({
			fromObject: options
		});

		return this._http.get('/user', { params: options }).pipe(map((users: any) => users.map(user => new UserModel(user)))).toPromise();
	}

	public create(user): Promise<any> {
		return this._http.post('/user', user).toPromise();
	}

	// public async update(changes, saveOnServer = true, showAlert: boolean = true, triggerModelOptions: boolean = false): Promise<boolean> {
	// 	try {
	// 		this.model.set(changes, triggerModelOptions);
	// 		// app.storage.updateProfile(this.model.options).catch(console.error);

	// 		if (saveOnServer) {
	// 			await this._http.put('/user/' + this.model.get('_id'), changes).toPromise();
	// 		}

	// 		if (showAlert) {
	// 			this._alertService.success('Settings saved');
	// 		}

	// 		return true;
	// 	} catch (error) {
	// 		console.error(error)
	// 		if (error && error.code) {
	// 			switch (parseInt(error.code, 10)) {
	// 				case G_ERROR_DUPLICATE_FIELD:
	// 					if (error.field === 'email')
	// 						this._alertService.error(`Email address already used with an account on CoinPush`);
	// 					break;
	// 				default:
	// 					this._alertService.error(`Unknown error occured`);
	// 			}
	// 		} else {
	// 			this._alertService.error(`Unknown error occured`);
	// 		}

	// 		return false;
	// 	}
	// }

	public async toggleFollow(model: UserModel, state: boolean): Promise<void> {
		const account = this._accountService.account$.getValue();

		if (!account._id) {
			// this._authenticationService.showLoginRegisterPopup();
			// return;
		}

		try {
			const result = <any>await this._http.post('/user/' + model.get('_id') + '/follow', null).toPromise();

			// DB state = following
			if (result.state)
				model.options.followers.push([account]);

			// DB state != following
			else
				model.options.followers.slice(model.options.followers.findIndex(f => f._id === account._id), 1);

			// update self
			model.set({
				iFollow: result.state,
				followersCount: result.state ? ++model.options.followersCount : --model.options.followersCount
			});

			// show alert banner
			this._alertService.success(`${result.state ? 'Now following' : 'Stopped following'} ${model.options.name}`);

		} catch (error) {
			console.error(error);
			this._alertService.error(`Error occurred while following ${model.options.username}`);
		}
	}

	public async remove() {
		const account = this._accountService.account$.getValue();

		try {
			await this._http.delete('/user/' + account._id).toPromise();
			return true;
		} catch (error) {
			console.error(error);
		}
	}
}