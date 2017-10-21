import {
	Component, ChangeDetectionStrategy, ViewEncapsulation, Output, EventEmitter, OnInit,
	OnDestroy, ElementRef, AfterViewInit
} from '@angular/core';
import {CacheService} from '../../services/cache.service';
import {ConstantsService} from "../../services/constants.service";
import {OrderService} from "../../services/order.service";
import {SymbolModel} from "../../models/symbol.model";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {SYMBOL_CAT_TYPE_FOREX, SYMBOL_CAT_TYPE_RESOURCE} from "../../../../../shared/constants/constants";
import {UserService} from "../../services/user.service";
import {ActivatedRoute} from "@angular/router";


@Component({
	selector: 'instrument-list',
	templateUrl: './instrument-list.component.html',
	styleUrls: ['./instrument-list.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstrumentListComponent implements OnInit, AfterViewInit, OnDestroy {

	@Output() activeSymbolChange = new EventEmitter<SymbolModel>();

	public activeSymbol: SymbolModel;
	public activeFilter: string = 'all';
	public symbols$: BehaviorSubject<Array<SymbolModel>> = new BehaviorSubject([]);

	private _routeSub;

	constructor(public cacheService: CacheService,
				public constantsService: ConstantsService,
				public userService: UserService,
				private _elementRef: ElementRef,
				private _route: ActivatedRoute,
				private _orderService: OrderService) {}

	ngOnInit() {
		this.toggleFilter(this.activeFilter);

		this._routeSub = this._route.params.subscribe(params => {
			const symbol = this.cacheService.symbols.find(s => s.options.name === params['id']);
			this.setActiveSymbol(symbol || this.symbols$.getValue()[0]);
		});
	}

	ngAfterViewInit() {
		this._scrollIntoView(this.activeSymbol);
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
			case 'favorite':
				this.symbols$.next(this.cacheService.symbols.filter(s => this.userService.model.options.favorites.includes(s.options.name)));
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
	}

	onClickToggleFavorite(event, symbol: SymbolModel) {
		event.preventDefault();
		event.stopPropagation();

		this.userService.toggleFavoriteSymbol(symbol);
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

	private _scrollIntoView(symbol: SymbolModel) {
		if (!symbol)
			return;

		const el = this._elementRef.nativeElement.shadowRoot.querySelector(`[data-symbol=${symbol.get('name')}]`);

		if (el)
			el.scrollIntoView();
	}

	ngOnDestroy() {
		if (this._routeSub)
			this._routeSub.unsubscribe();
	}
}