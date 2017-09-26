import { Injectable } from '@angular/core';
import { Response, Http } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';
import {ChannelModel} from '../models/channel.model';
import {AlertService} from './alert.service';

@Injectable()
export class ChannelService {
	constructor(private _http: Http, private _alertService: AlertService) {

	}

	get(channelId: string): Observable<ChannelModel> {
		return this._http.get('/channel/' + channelId).map(res => new ChannelModel(res.json().user[0]));
	}

	getByUserId(userId: string): Observable<ChannelModel> {
		return this._http.get('/channel/', {params: {user: userId}}).map(res => new ChannelModel(res.json()));
	}

	create(model: ChannelModel): Observable<ChannelModel> {
		return this._http.post('/channel', {
			name: model.get('name'),
			description: model.get('description'),
			public: !!model.get('public')
		}).map(res => res.json());
	}

	update(model: ChannelModel, options): Observable<Response> {
		return this._http.put('/channel/' + model.get('_id'), options);
	}

	toggleFollow(model: ChannelModel, state: boolean) {

		const subscription = this._http.post('/channel/' + model.get('_id') + '/follow', null).map(res => res.json());

		subscription.subscribe(result => {
			let text;

			if (result.state) {
				model.set({
					iFollow: !!state,
					followersCount: ++model.options.followersCount
				});
				text = `Now following ${model.options.name}`;
			} else {
				text = `Stopped following ${model.options.name}`;
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

	toggleCopy(model: ChannelModel, state: boolean) {
		const subscription = this._http.post('/channel/' + model.get('_id') + '/copy', '').map(res => res.json());

		subscription.subscribe(result => {
			let text;

			if (result.state) {
				model.set({
					iCopy: !!state,
					copiersCount: ++model.options.copiersCount
				});
				text = `Now copying ${model.options.name}`;
			} else {
				text = `Stopped copying ${model.options.name}`;
				model.set({
					iCopy: !!state,
					copiersCount: --model.options.copiersCount
				});
			}
			this._alertService.success(text);
		}, (error) => {
			console.error(error);
			this._alertService.error(`An error occurred when copying ${model.options.username}...`);
		});

		return subscription;
	}

	delete(model: ChannelModel): Observable<Response> {
		return this._http.delete('/channel/' + model.get('_id'));
	}
}