import {Injectable} from '@angular/core';
import {LoginComponent} from '../components/login/login.component';
import {CookieService} from 'ngx-cookie';
import {SocketService} from './socket.service';
import {ModalService} from './modal.service';
import {UserModel} from '../models/user.model';
import {CustomHttp} from './http.service';
import {Http, Response} from '@angular/http';

declare var $: any;

@Injectable()
export class UserService {

	public model: UserModel = new UserModel();

	constructor(private _http: Http,
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

	getList() {
		return this._http.get('/social/users').map((res: Response) => res.json());
	}

	toggleFollow(state: boolean, model: UserModel) {
		model.set({follow: !!state});

		if (state)
			return this._http.post('/social/user/follow/' + model.get('_id'), '');

		return this._http.post('/social/user/un-follow/' + model.get('_id'), '');
	}
}