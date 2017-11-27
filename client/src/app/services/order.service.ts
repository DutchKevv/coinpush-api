import { Injectable, Output } from '@angular/core';
import { Http } from '@angular/http';
import { ConstantsService } from './constants.service';
import { CacheService } from './cache.service';
import { AlertService } from './alert.service';
import { UserService } from './user.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { OrderModel } from '../models/order.model';
import { SymbolModel } from "../models/symbol.model";

@Injectable()
export class OrderService {

	@Output() public orders$: BehaviorSubject<Array<OrderModel>> = new BehaviorSubject([]);

	private _audio = {
		fail: new Audio('/assets/sounds/fail.mp3'),
		success: new Audio('/assets/sounds/success.mp3'),
	};

	constructor(private _cacheService: CacheService,
		private _userService: UserService,
		private _alertService: AlertService,
		private http: Http) {

		_cacheService.changed$.subscribe((symbols: Array<SymbolModel>) => this._onTick(symbols));
	}

	public get(id) {
		return this.http.get('/order/' + id).map(res => res.json());
	}

	public getList() {
		return this.http.get('/order/').map(res => res.json().map(order => this.createModel(order)));
	}

	public getById() {

	}

	public create(options): void {
		this.http.post('/order', options)
			.map(res => console.log(res.json()) || this.createModel(res.json()))
			.subscribe((order: OrderModel) => {

				// Update account
				this._userService.model.set({ balance: order.get('balance') });
				this.calculateAccountStatus();

				// Push order onto stack
				const orders = Array.from(this.orders$.getValue());
				orders.push(order);
				this.orders$.next(orders);

				// Play success sound
				this._audio.success.play();

				// Show conformation box
				this._alertService.success('Order set');
			}, (error) => {
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
	}

	public createModel(data): OrderModel {
		let model = new OrderModel(data),
			symbol = this._cacheService.getBySymbol(model.options.symbol);

		if (symbol) {
			this.updateModel(model, symbol.options);
			model.symbolHandle = symbol;
		} else {
			console.warn(`No symbol [${model.get('symbol')}] found belonging to order [${model.get('_id')}]`)
		}

		return model;
	}

	public updateModel(orderModel, symbolOptions) {
		const openValue = (orderModel.options.amount * orderModel.options.openPrice);
		const value = orderModel.options.amount * symbolOptions.ask;
		const PL = (value - openValue) * orderModel.options.amount;

		orderModel.set({
			value: value,
			PL: parseFloat(PL.toFixed(2)),
			PLPerc: parseFloat((((value / openValue) * 100) - 100).toFixed(2)),
		}, true, false);
	}

	public update(id, options) {
		return this.http.put('/order/' + id, options);
	}

	public async remove(id) {
		await this.http.delete('/order/' + id).toPromise();

		this.orders$.next(this.orders$.getValue().filter(o => o.options._id !== id));
		this.calculateAccountStatus();
		this._alertService.success('Order closed');
	}

	public calculateAccountStatus() {
		const orders = this.orders$.getValue();

		this._userService.accountStatus$.next({
			available: this._userService.model.get('balance'),
			equity: orders.reduce((sum: number, order: OrderModel) => sum + order.get('value'), 0),
			openMargin: 0,
			profit: orders.reduce((sum: number, order: OrderModel) => sum + order.get('PL'), 0),
		});
	}

	public load(unload = true) {
		if (unload)
			this.unload();

		// this.getList().subscribe((list: Array<OrderModel>) => {
		// 	this.orders$.next(list);
		// }, (error) => {
		// 	console.error(error);
		// 	this._alertService.error('Could not load order list');
		// });

		// this.calculateAccountStatus();
	}

	public unload() {
		this.orders$.next([]);
	}

	private _onTick(symbols) {
		// symbols.forEach(symbol => {
		// 	const model = this._cacheService.symbols.find(m => m === symbol);

		// 	if (model)
		// 		this.orders$.getValue()
		// 			.filter((o: OrderModel) => o.options.symbol === symbol)
		// 			.forEach((o: OrderModel) => {
		// 				this.updateModel(o, model.options);
		// 			});
		// });

		// this.calculateAccountStatus()
	}
}

