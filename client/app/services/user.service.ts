import {Injectable, Output} from '@angular/core';
import {UserModel} from '../models/user.model';
import {Http, Response} from '@angular/http';
import {AlertService} from './alert.service';
import {USER_FETCH_TYPE_SLIM} from '../../../shared/constants/constants';
import {StartupService} from './startup.service';

@Injectable()
export class UserService {

	@Output() model: UserModel = new UserModel(JSON.parse(localStorage.getItem('currentUser') || '{}'));

	constructor(private _http: Http,
				private _alertService: AlertService,
				private _startupService: StartupService) {
		this.init();
	}

	get connected() {
		return this.model.options.connected;
	}

	init() {
		this.model = this._startupService.getLoggedInUser;
	}

	create(user) {
		return this._http.post('/user', user).map((res: Response) => res.json());
	}

	get(id?: string, type = USER_FETCH_TYPE_SLIM) {
		id = id || '';
		return this._http.get('/social/user/' + id, {params: {type: type}}).map((res: Response) => new UserModel(res.json()));
	}

	getList() {
		return this._http.get('/social/users/').map((res: Response) => res.json());
	}

	update(changes) {
		console.log('changes!', changes);
		this.model.set(changes);

		return this._http.put('/social/user/', changes).subscribe(() => {
			this._alertService.success('Settings updated')
		}, () => {
			this._alertService.error('Error updating settings')
		});
	}

	toggleFollow(state: boolean, model: UserModel) {

		const subscription = this._http.post('/user/' + model.get('_id') + '/follow', null).map(res => res.json());

		subscription.subscribe(result => {
			let text;

			if (result.state) {
				model.set({
					iFollow: !!state,
					followersCount: ++model.options.followersCount
				});
				text = `You are now following ${model.options.username} !`;
			} else {
				text = `Unsigned from ${model.options.username}`;
				model.set({
					iFollow: !!state,
					followersCount: --model.options.followersCount
				});
			}
			this._alertService.success(text);
		}, (error) => {
			console.error(error);
			this._alertService.error(`An error occurred when following ${model.options.username}...`);
		});

		return subscription;
	}

	toggleCopy(model: UserModel, state: boolean) {
		const subscription = this._http.post('/user/' + model.get('_id') + '/copy', '').map(res => res.json());

		subscription.subscribe(result => {
			let text;

			if (result.state) {
				model.set({
					iCopy: !!state,
					followersCount: ++model.options.followersCount
				});
				text = `You are now following ${model.options.username} !`;
			} else {
				text = `Unsigned from ${model.options.username}`;
				model.set({
					iCopy: !!state,
					followersCount: --model.options.followersCount
				});
			}
			this._alertService.success(text);
		}, (error) => {
			console.error(error);
			this._alertService.error(`An error occurred when following ${model.options.username}...`);
		});

		return subscription;
	}

	setSelfUser(data) {
		this.model.set(data);
	}
}