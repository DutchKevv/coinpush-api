import {Injectable, NgZone} from '@angular/core';
import {Http} from '@angular/http';
import {ConstantsService} from './constants.service';
import {OrderModel} from '../../../shared/models/OrderModel';
import {CacheService} from './cache.service';
import {AlertService} from './alert.service';

@Injectable()
export class OrderService {

	constructor(private _constantsService: ConstantsService,
				private _cacheService: CacheService,
				private _alertService: AlertService,
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
		const subscription = this.http.post('/order', options).map(res => console.log(res.json()) || this.createModel(res.json()));

		subscription.subscribe(() => {
			let file = options.side === this._constantsService.constants.ORDER_SIDE_BUY ? 'sounds/3.mp3' : 'sounds/2.mp3';
			let audio = new Audio(file);
			audio.play();
			this._alertService.success('Order set');
		}, error => {
			this._alertService.error(error);
			console.error(error);
		});

		return subscription;
	}

	public createModel(data): OrderModel {
		let model = new OrderModel(data),
			symbol = this._cacheService.getBySymbol(model.options.symbol),
			symbolOptions$ = symbol.options$;

		model.symbolHandle = symbol;

		this.updateModel(model, symbolOptions$.getValue());

		const subscription = symbolOptions$.subscribe((options: any) => this.updateModel(model, options));

		model.subscription.push(subscription);

		return model;
	}

	public updateModel(orderModel, symbolOptions) {
		const openValue = (orderModel.options.amount * orderModel.options.openPrice);
		const value = orderModel.options.amount * symbolOptions.ask;
		const PL = value - openValue;

		orderModel.set({
			value: value,
			PL: parseFloat(PL.toFixed(2)),
			PLPerc: parseFloat((((value / openValue) * 100) - 100).toFixed(2)),
		}, false);
	}

	public update(id, options) {
		return this.http.put('/order/' + id, options);
	}

	public remove(id) {
		return this.http.delete('/order/' + id);
	}
}