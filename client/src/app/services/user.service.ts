import { Injectable, Output } from '@angular/core';
import { UserModel } from '../models/user.model';
import { AlertService } from './alert.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { SymbolModel } from "../models/symbol.model";
import { app } from '../../core/app';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthenticationService } from './authenticate.service';

@Injectable({
	providedIn: 'root',
})
export class UserService {

	public model: UserModel = new UserModel(Object.assign({
		name: 'Anonymous',
		img: '/assets/image/default-profile.jpg'
	}, app.storage.profileData || {}));

	constructor(
		private _http: HttpClient,
		private _alertService: AlertService) { }

	findById(id: string, options: any = {}): Promise<UserModel> {
		const params = new HttpParams({
			fromObject: options
		});
		return this._http.get('/user/' + id, { params }).map((res: Response) => new UserModel(res)).toPromise();
	}

	getOverview(options: any = {}) {
		const params = new HttpParams({
			fromObject: options
		});

		return this._http.get('/user', { params: options }).map((users: any) => users.map(user => new UserModel(user))).toPromise();
	}

	create(user) {
		return this._http.post('/user', user).toPromise();
	}

	async update(changes, toServer = true, showAlert: boolean = true) {
		try {
			this.model.set(changes);

			if (toServer) {
				await this._http.put('/user/' + this.model.get('_id'), changes).toPromise();
			}
			
			await app.storage.updateProfile(this.model.options);
			
			if (showAlert) {
				this._alertService.success('Settings saved');
			}
		} catch (error) {
			console.error(error);
			this._alertService.error('Error saving settings');
			throw error;
		}
	}

	async toggleFavoriteSymbol(symbol: SymbolModel) {
		try {
			const result = await this._http.post('/favorite', {
				symbol: symbol.options.name,
				state: !symbol.options.iFavorite
			}, { responseType: "text" }).toPromise();

			symbol.options.iFavorite = !symbol.options.iFavorite;
			return true;
		} catch (error) {
			console.error(error);
			return false;
		}
	}

	async toggleFollow(model: UserModel, state: boolean) {
		try {
			const result = <any>await this._http.post('/user/' + model.get('_id') + '/follow', null).toPromise();
			let text;

			if (result.state) {
				model.options.followers.push([{
					_id: this.model.get('user_id'),
					name: this.model.get('name'),
					img: this.model.get('profileImg'),
				}]);
				model.set({
					iFollow: result.state,
					followersCount: ++model.options.followersCount
				});
				text = `Now following ${model.options.name}`;
			} else {
				const index = model.options.followers.find(f => f._id === this.model.get('_id'));
				model.options.followers.slice(index, 1);

				model.set({
					iFollow: result.state,
					followersCount: --model.options.followersCount
				});
				text = `Stopped following ${model.options.name}`;
			}
			this._alertService.success(text);

			return true;
		} catch (error) {
			console.error(error);
			this._alertService.error(`An error occurred when following ${model.options.username}...`);
			return false;
		}
	}

	async remove() {
		try {
			await this._http.delete('/user/' + this.model.options._id).toPromise();
			return true;
		} catch (error) {
			console.error(error);
		}
	}
}