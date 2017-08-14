import {Injectable, Output} from '@angular/core';
import {UserModel} from '../models/user.model';
import {Http, Response} from '@angular/http';
import {AlertService} from './alert.service';
import {USER_FETCH_TYPE_SLIM} from '../../../shared/constants/constants';
import {StartupService} from './startup.service';

@Injectable()
export class UserService {

	@Output() model: UserModel = new UserModel();

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
		return this._http.post('/social/user', user).map((res: Response) => res.json());
	}

	get(id = '', type = USER_FETCH_TYPE_SLIM) {
		return this._http.get('/social/user/' + id, {body: {type}}).map((res: Response) => new UserModel(res.json()));
	}

	getList() {
		return this._http.get('/social/users').map((res: Response) => res.json());
	}

	toggleFollow(state: boolean, model: UserModel) {

		const subscription = this._http.post('/social/follow/' + model.get('_id'), '').map(res => res.json());

		subscription.subscribe(result => {
			let text;

			if (result.state) {
				model.set({
					follow: !!state,
					followersCount: ++model.options.followersCount
				});
				text = `You are now following ${model.options.username} !`;
			} else {
				text = `Unsigned from ${model.options.username}`;
				model.set({
					follow: !!state,
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