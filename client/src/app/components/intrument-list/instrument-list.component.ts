import {Component, ChangeDetectionStrategy, ViewEncapsulation, Output, EventEmitter, OnInit} from '@angular/core';
import {CacheService, CacheSymbol} from '../../services/cache.service';
import {ConstantsService} from "../../services/constants.service";
import {OrderService} from "../../services/order.service";


@Component({
	selector: 'instrument-list',
	templateUrl: './instrument-list.component.html',
	styleUrls: ['./instrument-list.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstrumentListComponent implements OnInit {

	@Output() activeSymbolChange = new EventEmitter<CacheSymbol>();

	public activeSymbol: CacheSymbol;

	constructor(public cacheService: CacheService,
				public constantsService: ConstantsService,
				private _orderService: OrderService) {}

	ngOnInit() {
		this.setActiveSymbol(this.cacheService.symbolList$.getValue()[0]);
	}

	setActiveSymbol(symbol: CacheSymbol) {
		this.activeSymbolChange.next(symbol);
		this.activeSymbol = symbol;
	}

	placeOrder(event, side, symbol) {
		event.preventDefault();
		event.stopPropagation();

		this._orderService.create({symbol, side, amount: 1});
	}
}