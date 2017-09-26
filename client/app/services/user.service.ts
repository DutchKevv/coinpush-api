import {Injectable, Output} from '@angular/core';
import {UserModel} from '../models/user.model';
import {Http, Response} from '@angular/http';
import {AlertService} from './alert.service';
import {USER_FETCH_TYPE_SLIM} from '../../../shared/constants/constants';
import {StartupService} from './startup.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

export interface IAccountStatus {
	available: number,
	equity: number,
	openMargin: number,
	profit: number
}

@Injectable()
export class UserService {

	@Output() model: UserModel;

	@Output() public accountStatus$: BehaviorSubject<IAccountStatus> = new BehaviorSubject({
		available: 0,
		equity: 0,
		openMargin: 0,
		profit: 0
	});

	constructor(private _http: Http,
				private _alertService: AlertService,
				private _startupService: StartupService) {

	}

	init() {
		this.model = this._startupService.loggedInUser;
	}

	get(id: string, type = USER_FETCH_TYPE_SLIM) {
		return this._http.get('/user/' + id, {params: {type: type}}).map((res: Response) => new UserModel(res.json()));
	}

	getOverview() {
		return this._http.get('/user-overview').map((res: Response) => res.json().editorChoice.map(user => new UserModel(user)));
	}

	create(user) {
		return this._http.post('/user', user).map((res: Response) => res.json());
	}

	update(changes, toServer = true) {
		console.log('CHANGES!');
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

	// toggleFollow(model: UserModel, state: boolean) {
	//
	// 	const subscription = this._http.post('/user/' + model.get('_id') + '/follow', null).map(res => res.json());
	//
	// 	subscription.subscribe(result => {
	// 		let text;
	//
	// 		if (result.state) {
	// 			model.set({
	// 				iFollow: !!state,
	// 				followersCount: ++model.options.followersCount
	// 			});
	// 			text = `You are now following ${model.options.username} !`;
	// 		} else {
	// 			text = `Unsigned from ${model.options.username}`;
	// 			model.set({
	// 				iFollow: !!state,
	// 				followersCount: --model.options.followersCount
	// 			});
	// 		}
	// 		this._alertService.success(text);
	// 	}, (error) => {
	// 		console.error(error);
	// 		this._alertService.error(`An error occurred when following ${model.options.username}...`);
	// 	});
	//
	// 	return subscription;
	// }
	//
	// toggleCopy(model: UserModel, state: boolean) {
	// 	const subscription = this._http.post('/user/' + model.get('_id') + '/copy', '').map(res => res.json());
	//
	// 	subscription.subscribe(result => {
	// 		let text;
	//
	// 		if (result.state) {
	// 			model.set({
	// 				iCopy: !!state,
	// 				copiersCount: ++model.options.followersCount
	// 			});
	// 			text = `You are now following ${model.options.username} !`;
	// 		} else {
	// 			text = `Unsigned from ${model.options.username}`;
	// 			model.set({
	// 				iCopy: !!state,
	// 				copiersCount: --model.options.followersCount
	// 			});
	// 		}
	// 		this._alertService.success(text);
	// 	}, (error) => {
	// 		console.error(error);
	// 		this._alertService.error(`An error occurred when following ${model.options.username}...`);
	// 	});
	//
	// 	return subscription;
	// }

	loadLocalStorageUser() {
		return JSON.parse(localStorage.getItem('currentUser'));
	}

	storeLocalStoreUser() {
		localStorage.setItem('currentUser', JSON.stringify(this.model.options));
	}
}