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
	constructor(private _http: Http) {

	}

	get(id: string): Observable<Response> {
		return this._http.get('/channel/' + id).map(res => res.json());
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

	delete(model: ChannelModel): Observable<Response> {
		return this._http.delete('/channel/' + model.get('_id'));
	}
}