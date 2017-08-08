import {debounce} from 'lodash';
import {
	Component, OnInit, OnDestroy, ChangeDetectionStrategy,
	AfterViewChecked, ViewEncapsulation, Output, Pipe, PipeTransform
} from '@angular/core';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {OrderService} from '../../services/order.service';
import {ConstantsService} from '../../services/constants.service';
import {CacheService} from '../../services/cache.service';
import {OrderModel} from '../../../../shared/models/OrderModel';

declare let $: any;

@Pipe({name: 'groupBy'})
export class GroupByPipe implements PipeTransform {
	transform(value: Array<any>, field: string): Array<any> {
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

		result.forEach(row => {
			row.symbolHandle = row.items[0].symbolHandle,
			row.symbol = row.items[0].options.symbol,
			row.amount = row.items.reduce((sum, order) => sum + order.options.amount, 0);
			row.invested = row.items.reduce((sum, order) => sum + (order.options.amount * order.options.openPrice), 0);
			row.value = row.items.reduce((sum, order) => sum + order.options.value, 0);
			row.PL = row.items.reduce((sum, order) => sum + order.options.PL, 0);
			row.PLPerc = row.items.reduce((sum, order) => sum + order.options.PLPerc, 0).toFixed(2);
		});

		console.log(result);
		return result;
	}
}


@Component({
	selector: 'app-portfolio',
	templateUrl: './portfolio.component.html',
	styleUrls: ['./portfolio.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class PortfolioComponent implements OnInit, OnDestroy, AfterViewChecked {

	@Output() public orders$: BehaviorSubject<[]> = new BehaviorSubject([]);

	constructor(public constantsService: ConstantsService,
				public cacheService: CacheService,
				private _orderService: OrderService) {
	}

	ngOnInit() {
		this.getList();
	}

	ngAfterViewChecked() {}

	getList(): void {
		this._destroyModels();

		this._orderService.getList().subscribe((list) => {
			// Wait until cache is ready
			this.orders$.next(list);
		});
	}

	public toggleRow(el, symbol: string): void {
		let isOpen = !el.classList.contains('open');

		el.classList.toggle('open', isOpen);
	}

	placeOrder(event, side, model) {
		event.preventDefault();

		this._orderService.create({symbol: model.options.symbol, side, amount: 1});
	}

	private _destroyModels() {
		this.orders$.getValue().forEach((order: OrderModel) => order.destroy());
	}

	ngOnDestroy() {
		this._destroyModels();
	}
}