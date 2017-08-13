import {Injectable} from '@angular/core';
import {LoginComponent} from '../components/login/login.component';
import {CookieService} from 'ngx-cookie';
import {SocketService} from './socket.service';
import {ModalService} from './modal.service';
import {UserModel} from '../models/user.model';
import {CustomHttp} from './http.service';
import {Http, Response} from '@angular/http';
import {AlertService} from './alert.service';

declare var $: any;

@Injectable()
export class UserService {

	public model: UserModel = new UserModel();

	constructor(private _http: Http,
				private _alertService: AlertService,
				private _cookieService: CookieService,
				private _modalService: ModalService,
				private _socketService: SocketService) {
	}

	get connected() {
		return this.model.options.connected;
	}

	init() {
		this._socketService.socket.on('user-details', () => {

		});
	}

	create(user) {
		return this._http.post('/social/user', user).map((res: Response) => res.json());
	}

	get(id: string) {
		return this._http.get('/social/user/' + id).map((res: Response) => new UserModel(res.json()));
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
}