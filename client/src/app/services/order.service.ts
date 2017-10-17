import {Injectable, Output} from '@angular/core';
import {Http} from '@angular/http';
import {ConstantsService} from './constants.service';
import {CacheService} from './cache.service';
import {AlertService} from './alert.service';
import {UserService} from './user.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {OrderModel} from '../models/order.model';

@Injectable()
export class OrderService {

	@Output() public orders$: BehaviorSubject<Array<OrderModel>> = new BehaviorSubject([]);

	private _audio = {
		fail: new Audio('sounds/fail.mp3'),
		success: new Audio('sounds/success.mp3'),
	};

	constructor(private _constantsService: ConstantsService,
				private _cacheService: CacheService,
				private _userService: UserService,
				private _alertService: AlertService,
				private http: Http) {
	}

	init() {
		this.getList().subscribe((list: Array<OrderModel>) => {
			this.orders$.next(list);
		}, () => {
			this._alertService.error('Could not load order list');
		})

		this.calculateAccountStatus();
	}

	public get (id) {
		return this.http.get('/order/' + id).map(res => res.json());
	}

	public getList() {
		return this.http.get('/order/').map(res => res.json().map(order => this.createModel(order)));
	}

	public getById() {

	}

	public create(options) {
		const subscription = this.http.post('/order', options).map(res => console.log(res.json()) || this.createModel(res.json()));

		subscription.subscribe((order: OrderModel) => {

			// Update account
			this._userService.model.set({balance: order.get('balance')});
			this.calculateAccountStatus();

			// Push order onto stack
			const orders = Array.from(this.orders$.getValue());
			orders.push(order);
			this.orders$.next(orders);

			// Play success sound
			this._audio.success.play();

			// Show conformation box
			this._alertService.success('Order set');
		},  (error) => {
			console.log(error);

			// Play fail sound
			this._audio.fail.play();

			// Try parsing information about failure
			try {
				error = JSON.parse(error);
				this._alertService.error(error.error.message);
			} catch (error) {
				this._alertService.error('Unknown error occurred');
			}
		});

		return subscription;
	}

	public createModel(data): OrderModel {
		let model = new OrderModel(data),
			symbol = this._cacheService.getBySymbol(model.options.symbol),
			symbolOptions$ = symbol.options$;

		model.symbolHandle = symbol;

		this.updateModel(model, symbolOptions$.getValue());

		const subscription = symbolOptions$.subscribe((options: any) => {
			this.updateModel(model, options);

			this.calculateAccountStatus()
		});

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

	calculateAccountStatus() {
		const orders = this.orders$.getValue();

		this._userService.accountStatus$.next({
			available: this._userService.model.get('balance'),
			equity: orders.reduce((sum: number, order: OrderModel) => sum + order.get('value'), 0),
			openMargin: 0,
			profit: orders.reduce((sum: number, order: OrderModel) => sum + order.get('PL'), 0),
		});
	}
}

