import {Injectable, Output} from '@angular/core';
import {UserModel} from '../models/user.model';
import {Http, Response} from '@angular/http';
import {AlertService} from './alert.service';
import {USER_FETCH_TYPE_SLIM} from '../../../../shared/constants/constants';
// import {StartupService} from './startup.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {SymbolModel} from "../models/symbol.model";

export interface IAccountStatus {
	available: number,
	equity: number,
	openMargin: number,
	profit: number
}

@Injectable()
export class UserService {

	@Output() model: UserModel = new UserModel();

	@Output() public accountStatus$: BehaviorSubject<IAccountStatus> = new BehaviorSubject({
		available: 0,
		equity: 0,
		openMargin: 0,
		profit: 0
	});

	constructor(private _http: Http,
				private _alertService: AlertService) {

	}

	find(id: string, type = USER_FETCH_TYPE_SLIM) {
		return this._http.get('/user/' + id, {params: {type: type}}).map((res: Response) => new UserModel(res.json()));
	}

	getOverview() {
		return this._http.get('/user-overview').map((res: Response) => res.json().editorChoice.map(user => new UserModel(user)));
	}

	create(user) {
		return this._http.post('/user', user).map((res: Response) => res.json());
	}

	update(changes, toServer = true) {
		this.model.set(changes);

		if (toServer) {
			return this._http.put('/user/' + this.model.get('user_id'), changes).subscribe(() => {
				this.storeLocalStoreUser();
				this._alertService.success('Settings saved');
			}, error => {
				console.error(error);
				this._alertService.error('Error saving settings')
			});
		}
		else {
			this.storeLocalStoreUser();
			this._alertService.success('Settings saved');
		}
	}

	toggleFavoriteSymbol(symbol: SymbolModel) {
		this._http.post('/favorite', {symbol: symbol.get('name')})
			.map((res: Response) => res.json())
			.subscribe(result => {
				if (result.state)
					this.model.options.favorites.push(symbol.get('name'));
				else
					this.model.options.favorites.splice(this.model.options.favorites.indexOf(symbol.get('name')), 1);
			})
	}

	loadLocalStorageUser() {
		return JSON.parse(localStorage.getItem('currentUser'));
	}

	storeLocalStoreUser() {
		localStorage.setItem('currentUser', JSON.stringify(this.model.options));
	}
}