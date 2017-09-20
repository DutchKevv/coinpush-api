import {Injectable, Output} from '@angular/core';
import {Http} from '@angular/http';
import {ConstantsService} from './constants.service';
import {OrderModel} from '../../../shared/models/OrderModel';
import {CacheService} from './cache.service';
import {AlertService} from './alert.service';
import {UserService} from './user.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Injectable()
export class OrderService {

	@Output() public orders$: BehaviorSubject<Array<OrderModel>> = new BehaviorSubject([]);

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

		const subscription = symbolOptions$.subscribe((options: any) => {
			this.updateModel(model, options);

			this._calculateAccountStatus()
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

	private _calculateAccountStatus() {
		const orders = this.orders$.getValue();

		this._userService.accountStatus$.next({
			available: 0,
			equity: orders.reduce((sum: number, order: OrderModel) => sum + order.get('value'), 0),
			openMargin: 0,
			profit: orders.reduce((sum: number, order: OrderModel) => sum + order.get('PL'), 0),
		});
	}
}

