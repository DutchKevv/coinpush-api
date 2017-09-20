import {debounce} from 'lodash';
import {
	Component, OnInit, OnDestroy, ChangeDetectionStrategy,
	AfterViewChecked, ViewEncapsulation, Output, Pipe, PipeTransform, ChangeDetectorRef, NgZone
} from '@angular/core';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {OrderService} from '../../services/order.service';
import {ConstantsService} from '../../services/constants.service';
import {CacheService} from '../../services/cache.service';
import {OrderModel} from '../../../../shared/models/OrderModel';
import {UserService} from '../../services/user.service';
import {InstrumentModel} from '../../../../shared/models/InstrumentModel';

declare let $: any;

function groupBy(value: Array<any>, field: string): Array<any> {
	const groupedObj = value.reduce((prev, cur) => {
		if (!prev[cur.options[field]]) {
			prev[cur.options[field]] = [cur];
		} else {
			prev[cur.options[field]].push(cur);
		}
		return prev;
	}, {});

	let rows = Object.keys(groupedObj).map(key => ({
		key,
		items: groupedObj[key]
	}));

	setRowValues(rows);

	return rows;
}

function setRowValues(rows) {
	rows.forEach((row: any) => {
		row.symbolHandle = row.items[0].symbolHandle;
		row.symbol = row.items[0].options.symbol;
		row.amount = row.items.reduce((sum, order) => sum + order.options.amount, 0);
		row.invested = row.items.reduce((sum, order) => sum + (order.options.amount * order.options.openPrice), 0);
		row.value = row.items.reduce((sum, order) => sum + order.options.value, 0);
		row.PL = row.items.reduce((sum, order) => sum + order.options.PL, 0);
		row.PLPerc = row.items.reduce((sum, order) => sum + order.options.PLPerc, 0).toFixed(2);
	});
}

@Pipe({name: 'groupBy'})
export class GroupByPipe implements PipeTransform {
	transform(value: Array<any>, field: string): Array<any> {
		return groupBy(value, field);
	}
}


@Component({
	selector: 'app-portfolio',
	templateUrl: './portfolio.component.html',
	styleUrls: ['./portfolio.component.scss'],
	encapsulation: ViewEncapsulation.Native
	// changeDetection: ChangeDetectionStrategy.OnPush
})

export class PortfolioComponent implements OnInit, OnDestroy {

	public totalAllocated: Number = 0;
	public activeSymbol$: BehaviorSubject<InstrumentModel> = new BehaviorSubject(null);

	public activeSymbol;
	private _ordersSubscription;

	constructor(public constantsService: ConstantsService,
				public userService: UserService,
				public orderService: OrderService,
				public cacheService: CacheService,
				private _zone: NgZone,
				private cdRef: ChangeDetectorRef) {
	}

	ngOnInit() {
		this._ordersSubscription = this.orderService.orders$.subscribe((list: Array<OrderModel>) => {
			const grouped = this._groupBy(list, 'symbol');

			this.totalAllocated = (<any>grouped).reduce((sum, group: any) => {
				return sum + group.invested;
			}, 0).toFixed(2);

			if (list.length)
				this.activeSymbol$.next(new InstrumentModel({
					symbol: list[0].get('symbol'),
					timeFrame: 'M15'
				}));
		});
	}

	public toggleRow(el, symbol: string): void {
		let isOpen = !el.classList.contains('open');

		this.activeSymbol$.next(new InstrumentModel({
			symbol: symbol,
			timeFrame: 'M15'
		}));

		this.activeSymbol = new InstrumentModel({
			symbol: symbol,
			timeFrame: 'M15'
		});

		el.classList.toggle('open', isOpen);
	}

	placeOrder(event, side, model) {
		event.preventDefault();
		event.stopPropagation();

		this.orderService.create({symbol: model.options.symbol, side, amount: 1});
	}

	async closeOrder(event, model) {
		event.preventDefault();
		event.stopPropagation();

		await this.orderService.remove(model.get('_id'));

		// this.orders$.next(this.orders$.getValue().filter(order => order.get('_id') === model.get('_id')))
	}

	private _groupBy(value, field) {
		const groupedObj = value.reduce((prev, cur) => {
			if (!prev[cur.options[field]]) {
				prev[cur.options[field]] = [cur];
			} else {
				prev[cur.options[field]].push(cur);
			}
			return prev;
		}, {});

		let result = Object.keys(groupedObj).map(key => ({
			key,
			items: groupedObj[key]
		}));

		result.forEach((row: any) => {
			row.symbolHandle = row.items[0].symbolHandle;
			row.symbol = row.items[0].options.symbol;
			row.amount = row.items.reduce((sum, order) => sum + order.options.amount, 0);
			row.invested = row.items.reduce((sum, order) => sum + (order.options.amount * order.options.openPrice), 0);
			row.value = row.items.reduce((sum, order) => sum + order.options.value, 0);
			row.PL = row.items.reduce((sum, order) => sum + order.options.PL, 0);
			row.PLPerc = row.items.reduce((sum, order) => sum + order.options.PLPerc, 0).toFixed(2);
		});

		console.log(result);
		return result;
	}

	ngOnDestroy() {
		this._ordersSubscription.unsubscribe();
	}
}