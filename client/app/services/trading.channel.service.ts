import {Injectable} from '@angular/core';
import {LoginComponent} from '../components/login/login.component';
import {CookieService} from 'ngx-cookie';
import {SocketService} from './socket.service';
import {ModalService} from './modal.service';
import {UserModel} from '../models/user.model';
import {CustomHttp} from './http.service';
import {Http, Response} from '@angular/http';
import {TradingChannelModel} from '../models/social.trader.model';

declare var $: any;

@Injectable()
export class TradingChannelService {

	public model: UserModel = new UserModel();

	constructor(private _http: Http,
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
		return this._http.post('/social/users', user).map((res: Response) => res.json());
	}

	async getList() {
		let data = [
			{
				id: 0,
				username: 'test1',
				following: false,
				followers: 12,
				followEquality: '82940,-',
				transactions: 100,
				runTime: 100000000,
				pips: 500,
				profit: 10000,
				profileImg: 'images/defaults/trading-channel/trader.jpeg',
				description: 'blablablabla'
			},
			{
				id: 1,
				username: 'test2',
				following: false,
				followers: 12,
				followEquality: '82940,-',
				transactions: 100,
				runTime: 100000000,
				pips: 500,
				profit: 10000,
				profileImg: 'images/defaults/trading-channel/trader.jpeg',
				description: 'blablablabla'
			},
			{
				id: 2,
				username: 'test3',
				following: false,
				followers: 12,
				followEquality: '82940,-',
				transactions: 100,
				runTime: 100000000,
				pips: 500,
				profit: 10000,
				profileImg: 'images/defaults/trading-channel/trader.jpeg',
				description: 'blablablabla'
			},
			{
				id: 3,
				username: 'test3',
				following: false,
				followers: 12,
				followEquality: '82940,-',
				transactions: 100,
				runTime: 100000000,
				pips: 500,
				profit: 10000,
				profileImg: 'images/defaults/trading-channel/trader.jpeg',
				description: 'blablablabla'
			}
		];

		return Array.prototype.concat(data, data, data, data, data, data).map(socialTrader => new TradingChannelModel(socialTrader));
		// return this._http.get('/social/users').map((res: Response) => res.json());
	}

	toggleFollow(state: boolean, model: UserModel) {
		model.set({follow: !!state});

		if (state)
			return this._http.post('/social/users/follow/' + model.get('_id'), '');

		return this._http.post('/social/users/un-follow/' + model.get('_id'), '');
	}
}