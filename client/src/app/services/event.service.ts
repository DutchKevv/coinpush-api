import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { CommentModel } from '../models/comment.model';
import { AlertService } from './alert.service';
import { UserService } from "./user.service";
import { app } from '../../core/app';
import { CacheService } from './cache.service';
import { EventModel } from '../models/event.model';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
	providedIn: 'root',
})
export class EventService {

	public events$: BehaviorSubject<Array<EventModel>> = new BehaviorSubject([]);

	constructor(
		private _http: HttpClient,
		private _alertService: AlertService,
		private _userService: UserService,
		private _cacheService: CacheService
	) { }

	public init() {
		this._initializeEvents();
		this._updateSymbolIAlarms();

		app.on('event-triggered', event => this._onEventTriggered(event));
	}

	public async create(params: any): Promise<EventModel> {
		try {
			const result = <any>await this._http.post('/event', params)
				.toPromise();

			// this._alertService.success(`Alarm set on ${params.symbol} - Price $${params.amount}`);

			const eventModel = new EventModel(
				result._id,
				result.createdAt,
				result.symbol,
				result.type,
				result.alarm,
				result.triggered,
				result.triggeredDate
			);

			const events = this.events$.getValue();
			events.unshift(eventModel);
			this._updateSymbolIAlarms(events);
			this.events$.next(events);

			return eventModel;
		} catch (error) {
			console.error(error);
			return null
		}
	}

	public async findById(id: string): Promise<Array<CommentModel>> {
		const result = <any>await this._http.get('/event/' + id)
			.map(r => {
				const model = new CommentModel(r);
				model.options.children = model.options.children.map(c => new CommentModel(c));
				return model;
			})
			.toPromise();

		return result;
	}

	public findBySymbol(symbol: string, offset: number = 0, limit: number = 5, history?: boolean): any {
		const params = new HttpParams({
			fromObject: {
				symbol,
				history: history.toString(),
				offset: offset.toString(),
				limit: limit.toString()
			}
		});

		return this._http.get('/event', { params });
	}

	public update(model: CommentModel, options): Observable<Response> {
		return <any>this._http.put('/event/' + model.get('_id'), options);
	}

	public remove(eventModel: EventModel): Promise<any> {
		const events = this.events$.getValue();
		events.splice(events.indexOf(eventModel), 1);

		this._updateSymbolIAlarms(events);

		this.events$.next(events);
		return this._http.delete('/event/' + eventModel._id).toPromise();
	}

	private _onEventTriggered(event) {
		console.log('_onEventTriggered', event);
		this._alertService.success(event.title);
		
	}

	private _updateSymbolIAlarms(events?: Array<EventModel>) {
		events = events || this.events$.getValue();

		this._cacheService.symbols.forEach(symbol => {
			symbol.options.iAlarm = !!events.find(event => event.symbol === symbol.options.name);
		});
	}

	private _initializeEvents() {
		this.events$.next((app.data.events || []).map(event => new EventModel(
			event._id,
			event.createdAt,
			event.symbol,
			event.type,
			event.alarm,
			event.triggered,
			event.triggeredDate
		)));

		delete app.data.events
	}
}