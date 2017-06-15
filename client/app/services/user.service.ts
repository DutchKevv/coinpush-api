import {Injectable} from '@angular/core';
import {LoginComponent} from '../components/login/login.component';
import {CookieService} from 'ngx-cookie';
import {SocketService} from './socket.service';
import {ModalService} from './modal.service';
import {UserModel} from '../models/user.model';

declare var $: any;

@Injectable()
export class UserService {

	public model: UserModel = new UserModel();

	constructor(private _cookieService: CookieService,
				private _modalService: ModalService,
				private _socketService: SocketService) {
	}

	get connected() {
		return this.model.connected;
	}

	init() {
		this._socketService.socket.on('user-details', () => {

		});
	}

	login() {
		let self = this;

		let loginComponentRef = this._modalService.create(LoginComponent, {
			showCloseButton: false,
			model: this.model,
			buttons: [
				{value: 'login', text: 'Login', type: 'primary'},
				{text: 'Offline', type: 'default'}
			],
			onClickButton(value) {
				if (value === 'login') {

					$.post('http://localhost:3000/login', this.model, (response, status) => {

						if (status === 'success') {
							this.model.connected = true;

							self._modalService.destroy(loginComponentRef);

						} else {

							alert('error! ' + status);
						}
					});
				}
			}
		});
	}

	logout() {
		return new Promise((resolve, reject) => {

			$.get('http://localhost:3000/logout', (response, status) => {
				if (status === 'success') {

					this.model.connected = false;

					resolve({
						status: 'success'
					});
				} else {
					alert('error!');
					reject();
				}
			});
		});
	}

	storeSession(): Object {
		let data: any = null;

		try {
			let cookie = this._cookieService.get('account-settings');

			if (cookie)
				data = JSON.parse(cookie);

		} catch (err) {
			// TODO
		}

		return data;
	}

	deleteSessesion(): void {
		// this._cookieService.put('account-settings', JSON.stringify(this.model));
	}
}