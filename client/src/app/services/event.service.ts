import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { CommentModel, IComment } from '../models/comment.model';
import { AlertService } from './alert.service';
import { UserService } from "./user.service";
import { CacheService } from './cache.service';
import { EventModel } from '../models/event.model';
import { HttpClient, HttpParams } from '@angular/common/http';

import { map } from 'rxjs/operators';
import { DateService } from './date.service';

@Injectable({
	providedIn: 'root',
})
export class EventService {

	public events$: BehaviorSubject<Array<EventModel>> = new BehaviorSubject([]);

	constructor(
		private _http: HttpClient,
		private _alertService: AlertService,
		private _userService: UserService,
		private _cacheService: CacheService,
		private _dateService: DateService
	) { }

	public init() {
		// this._initializeEvents();
		this._updateSymbolIAlarms();

		// app.on('price-alarm', event => this._onEventTriggered(event));
	}

	/**
	 * 
	 * @param params 
	 */
	public async create(params: any): Promise<EventModel> {
		try {
			const result = <any>await this._http.post('/event', params).toPromise();

			// this._alertService.success(`Alarm set on ${params.symbol} - Price $${params.amount}`);

			const eventModel = new EventModel(
				result._id,
				result.createdAt,
				result.symbol,
				result.type,
				result.alarm,
				result.triggered,
				result.triggeredDate,
				result.removed
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

	/**
	 * 
	 * @param id 
	 */
	public async findById(id: string): Promise<Array<CommentModel>> {
		const result = <any>await this._http
			.get('/event/' + id)
			.pipe(map((r: IComment) => {
				const model = new CommentModel(r);
				model.options.children = model.options.children.map(c => new CommentModel(c));
				return model;
			}))
			.toPromise();

		return result;
	}

	/**
	 * 
	 * @param symbol 
	 * @param offset 
	 * @param limit 
	 * @param history 
	 */
	public findBySymbol(symbol: string, offset: number = 0, limit: number = 5, history?: boolean): any {
		const params = new HttpParams({
			fromObject: {
				symbol,
				history: history.toString(),
				offset: offset.toString(),
				limit: limit.toString()
			}
		});

		return this._http.get('/event', { params }).pipe(map((events: Array<any>) => {
			return events.map(event => {
				event.triggeredDate = this._dateService.convertToTimePast(event.triggeredDate);
				return event;
			})
		}));
	}

	/**
	 * 
	 * @param model 
	 * @param options 
	 */
	public update(model: CommentModel, options): Observable<Response> {
		return <any>this._http.put('/event/' + model.get('_id'), options);
	}

	/**
	 * 
	 * @param eventModel 
	 * @param syncWithServer 
	 */
	public remove(eventModel: EventModel, syncWithServer: boolean = true): Promise<any> {
		const events = this.events$.getValue();
		eventModel.removed = true;

		events.splice(events.indexOf(eventModel), 1);

		this._updateSymbolIAlarms(events);

		this.events$.next(events);

		if (syncWithServer) {
			return this._http.delete('/event/' + eventModel._id).toPromise();
		} else {
			return Promise.resolve();
		}
	}

	/**
	 * 
	 * @param eventData 
	 */
	private _onEventTriggered(eventData) {
		const event = this.events$.getValue().find(event => event._id === eventData.eventId);

		if (event) {
			// play sound
			// const sound = new Audio('/assets/sound/cow.mp3');
			// sound.play();

			this.remove(event, false);
		} else {
			console.warn('event not found in cache');
		}

		this._alertService.success(eventData.title);
	}

	/**
	 * 
	 * @param events 
	 */
	private _updateSymbolIAlarms(events?: Array<EventModel>) {
		events = events || this.events$.getValue();

		for (let i = 0, len = this._cacheService.symbols.length; i < len; i++) {
			const symbol = this._cacheService.symbols[i];
			symbol.options.iAlarm = !!events.find(event => event.symbol === symbol.options.name);
		}
	}

	/**
	 * 
	 */
	private _initializeEvents(events: any[]) {
		this.events$.next((events).map(event => new EventModel(
			event._id,
			this._dateService.convertToTimePast(event.createdAt),
			event.symbol,
			event.type,
			event.alarm,
			event.triggered,
			event.triggeredDate,
			event.removed
		)));
	}
}