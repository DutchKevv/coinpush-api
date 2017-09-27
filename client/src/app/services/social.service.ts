import {Injectable, NgZone, Output} from '@angular/core';
import {SocketService} from './socket.service';
import {TradingChannelModel} from '../models/social.trader.model';
import {Http, Response} from '@angular/http';


@Injectable()
export class SocialService {

	constructor(private http: Http,
				private _zone: NgZone,
				private _socketService: SocketService) {
	}

	public init(): void {

	}

	public getList(): Promise<Array<TradingChannelModel>> {

		return new Promise(() => {

			this.http.get('/social/trading-channels').map(res => res.json());
		});
	}
}