import {Injectable, NgZone} from '@angular/core';
import {Http} from '@angular/http';
import {ConstantsService} from './constants.service';
import {OrderModel} from '../../../shared/models/OrderModel';
import {CacheService} from './cache.service';

@Injectable()
export class OrderService {

	constructor(private _constantsService: ConstantsService,
				private _cacheService: CacheService,
				private http: Http) {
	}

	init() {

	}

	public get (id) {
		return this.http.get('/order/' + id).map(res => res.json());
	}

	public getList() {
		return this.http.get('/orders/').map(res => res.json().map(order => this.createModel(order)));
	}

	public getById() {

	}

	public create(options) {
		const subscription = this.http.post('/order', options).map(res => this.createModel(res.json()));

		subscription.subscribe(() => {
			let file = options.side === this._constantsService.constants.ORDER_SIDE_BUY ? 'sounds/3.mp3' : 'sounds/2.mp3';
			let audio = new Audio(file);
			audio.play();
		}, error => {
			console.error(error);
		});

		return subscription;
	}

	public createModel(data): OrderModel {
		const model = new OrderModel(data);

		const subscription = this._cacheService.getBySymbol(model.options.symbol).options$.subscribe((options: any) => {
				const openValue = (model.options.amount * options.openPrice);
				const value = model.options.amount * options.ask;
				const PL = value - openValue;

				model.set({
					value: value,
					PL: PL,
					PLPerc: ((value / openValue) * 100) - 100,
				}, false);
		});

		model.subscription.push(subscription);

		return model;
	}

	public update(id, options) {
		return this.http.put('/order/' + id, options);
	}

	public remove(id) {
		return this.http.delete('/order/' + id);
	}
}