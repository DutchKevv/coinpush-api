import { Injectable } from '@angular/core';
import { Response, Http } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import { CommentModel } from '../models/comment.model';
import { AlertService } from './alert.service';
import { UserService } from "./user.service";
import { app } from '../../core/app';
import { CacheService } from './cache.service';

@Injectable()
export class EventService {

	constructor(
		private _http: Http,
		private _alertService: AlertService,
		private _cacheService: CacheService,
		private _userService: UserService
	) {
		app.on('event-triggered', event => this._onEventTriggered(event));
	}

	async create(params: any): Promise<any> {
		try {
			const event = await this._http.post('/event', params)
				.map(res => res.json())
				.toPromise();

			this._alertService.success(`Price alarm set on ${params.symbol} - Price ${params.amount}`)

			return event;
		} catch (error) {
			console.error(error);
			return null
		}	
	}

	async findById(id: string): Promise<Array<CommentModel>> {
		const result = await this._http.get('/event/' + id)
			.map(res => [res.json()].map(r => {
				const model = new CommentModel(r);
				model.options.children = model.options.children.map(c => new CommentModel(c));
				return model;
			}))
			.toPromise();

		return result;
	}

	findBySymbol(symbol: string, offset: number = 0, limit: number = 5, history?: boolean): any {
		return this._http.get('/event', { params: { symbol, offset, limit, history } }).map(res => res.json());
	}

	update(model: CommentModel, options): Observable<Response> {
		return this._http.put('/event/' + model.get('_id'), options);
	}

	async remove(eventId: string): Promise<any> {
		const result = await this._http.delete('/event/' + eventId).toPromise();
		return result;
	}

	private _onEventTriggered(event) {
		console.log(event);
		const symbol = this._cacheService.getSymbolByName(event.symbol);
		if (symbol) {
			this._alertService.success(event.title);
			const audio = new Audio('./assets/sound/cow.mp3');
			audio.play();
		}

	}
}