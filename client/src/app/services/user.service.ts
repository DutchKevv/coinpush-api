import { Injectable, Output } from '@angular/core';
import { UserModel } from '../models/user.model';
import { Http, Response } from '@angular/http';
import { AlertService } from './alert.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { SymbolModel } from "../models/symbol.model";
import { app } from '../../core/app';

@Injectable()
export class UserService {

	public model: UserModel = new UserModel(app.user);

	constructor(
		private _http: Http,
		private _alertService: AlertService) {}

	findById(id: string, options: any = {}): Promise<UserModel> {
		return this._http.get('/user/' + id, { params: options }).map((res: Response) => new UserModel(res.json())).toPromise();
	}

	getOverview(options: any = {}) {
		return this._http.get('/user', { params: options }).map((res: Response) => res.json().map(user => new UserModel(user)));
	}

	create(user) {
		return this._http.post('/user', user).map((res: Response) => res.json());
	}

	async update(changes, toServer = true, showAlert: boolean = true) {
		this.model.set(changes);
		app.user = this.model.options;

		if (toServer) {
			try {
				await this._http.put('/user/' + this.model.get('_id'), changes).toPromise();
				await app.storeUser();

				if (showAlert)
					this._alertService.success('Settings saved');
			} catch (error) {
				console.error(error);
				this._alertService.error('Error saving settings')
			}
		}
		else {
			await app.storeUser();

			if (showAlert)
				this._alertService.success('Settings saved');
		}
	}

	async toggleFavoriteSymbol(symbol: SymbolModel) {
		try {
			const result = await this._http.post('/favorite', {
				symbol: symbol.options.name,
				state: !symbol.options.iFavorite 
			}).toPromise();

			symbol.options.iFavorite = !symbol.options.iFavorite;
			
		} catch (error) {
			console.error(error);
		}
	}

	async toggleFollow(model: UserModel, state: boolean) {
		try {
			const result = await this._http.post('/user/' + model.get('_id') + '/follow', null).map(res => res.json()).toPromise();

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