import {
	Component, ChangeDetectionStrategy, ViewEncapsulation, Output, EventEmitter, OnInit,
	OnDestroy
} from '@angular/core';
import {CacheService} from '../../services/cache.service';
import {ConstantsService} from "../../services/constants.service";
import {OrderService} from "../../services/order.service";
import {SymbolModel} from "../../models/symbol.model";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {SYMBOL_CAT_TYPE_FOREX, SYMBOL_CAT_TYPE_RESOURCE} from "../../../../../shared/constants/constants";


@Component({
	selector: 'instrument-list',
	templateUrl: './instrument-list.component.html',
	styleUrls: ['./instrument-list.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstrumentListComponent implements OnInit, OnDestroy {

	@Output() activeSymbolChange = new EventEmitter<SymbolModel>();

	public activeSymbol: SymbolModel;
	public activeFilter: string = 'all';
	public symbols$: BehaviorSubject<Array<SymbolModel>> = new BehaviorSubject([]);

	private _symbolsSub;

	constructor(public cacheService: CacheService,
				public constantsService: ConstantsService,
				private _orderService: OrderService) {}

	ngOnInit() {
		// TODO: Sub not necessary, should be complete on page load
		this.toggleFilter(this.activeFilter);
	}

	toggleFilter(filter: string) {
		this.activeFilter = filter;

		switch (filter) {
			case 'all':
				this.symbols$.next(this.cacheService.symbols);
				break;
			case 'all popular':
				this.symbols$.next(this.cacheService.symbols);
				break;
			case 'forex':
				this.symbols$.next(this.cacheService.symbols.filter(s => s.get('type') === SYMBOL_CAT_TYPE_FOREX));
				break;
			case 'forex pop':
				this.symbols$.next(this.cacheService.symbols.filter(s => s.get('type') === SYMBOL_CAT_TYPE_FOREX));
				break;
			case 'resources':
				this.symbols$.next(this.cacheService.symbols.filter(s => s.get('type') === SYMBOL_CAT_TYPE_RESOURCE));
				break;
		}

		this.setActiveSymbol(this.symbols$.getValue()[0]);
	}

	setActiveSymbol(symbol: SymbolModel) {
		this.activeSymbolChange.next(symbol);
		this.activeSymbol = symbol;
	}

	placeOrder(event, side, symbol) {
		event.preventDefault();
		event.stopPropagation();

		this._orderService.create({symbol, side, amount: 1});
	}

	ngOnDestroy() {
		if (this._symbolsSub)
			this._symbolsSub.unsubscribe();
	}
}