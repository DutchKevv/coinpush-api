import { Injectable, Output } from '@angular/core';
import { UserModel } from '../models/user.model';
import { Http, Response } from '@angular/http';
import { AlertService } from './alert.service';
import { USER_FETCH_TYPE_SLIM } from '../../../../shared/constants/constants';
// import {StartupService} from './startup.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { SymbolModel } from "../models/symbol.model";
import { ModalService } from './modal.service';
import { LoginComponent } from '../components/login/login.component';

export interface IAccountStatus {
	available: number,
	equity: number,
	openMargin: number,
	profit: number
}

@Injectable()
export class UserService {

	public model: UserModel;

	public accountStatus$: BehaviorSubject<IAccountStatus> = new BehaviorSubject({
		available: 0,
		equity: 0,
		openMargin: 0,
		profit: 0
	});

	constructor(
		private _http: Http,
		private _modalService: ModalService,
		private _alertService: AlertService) {
		this.setCurrentUser();
	}

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

		if (toServer) {
			try {
				await this._http.put('/user/' + this.model.get('_id'), changes).toPromise();
				this.storeCurrentUser();

				if (showAlert)
					this._alertService.success('Settings saved');
			} catch (error) {
				console.error(error);
				this._alertService.error('Error saving settings')
			}
		}
		else {
			this.storeCurrentUser();

			if (showAlert)
				this._alertService.success('Settings saved');
		}
	}

	async toggleFavoriteSymbol(symbol: SymbolModel) {
		try {
			symbol.options.iFavorite = !symbol.options.iFavorite;
			
			const result = await this._http.post('/favorite', {
				symbol: symbol.options.name,
				state: symbol.options.iFavorite 
			}).toPromise();
			
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

	setCurrentUser() {
		try {
			const user = JSON.parse(localStorage.getItem('currentUser'));
			console.log(user._id);

			if (user && user._id) {
				this.model = new UserModel(user);
				return;
			}
		} catch (error) {
			console.warn('Could not load stored user');
		} finally {
			if (!this.model)
				this.model = new UserModel({
					name: 'Anonymous'
				});
		}
	}

	storeCurrentUser() {
		localStorage.setItem('currentUser', JSON.stringify(this.model.options));
	}

	async remove() {
		try {
			await this._http.delete('/user/' + this.model.options._id).toPromise();
			return true;
		} catch (error) {
			console.error(error);
		}
	}

	public async showLoginRegisterPopup() {
		return new Promise((resolve) => {

			let self = this;
			console.log(this._modalService);
			let dialogComponentRef = this._modalService.create(LoginComponent, {
				type: 'dialog',
				title: 'Login / Register',
				showBackdrop: true,
				showCloseButton: true,
				model: {},
				buttons: [
					{ text: 'cancel', type: 'candel' },
					{ value: 'add', text: 'add', type: 'primary' }
				],
				onClickButton(value) {
					if (value === 'add') {
						self._modalService.destroy(dialogComponentRef);
						resolve(true);
					} else
						self._modalService.destroy(dialogComponentRef);
				}
			});
		});
	}
}