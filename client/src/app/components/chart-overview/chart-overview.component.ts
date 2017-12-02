import {
	Component, OnInit, ElementRef, QueryList, ViewChildren, ChangeDetectionStrategy, ViewEncapsulation, NgZone,
	ViewChild,
	ChangeDetectorRef,
	AfterViewInit,
	Output,
	OnDestroy,
	ApplicationRef,
	Injector
} from '@angular/core';

import { InstrumentsService } from '../../services/instruments.service';
import { ChartBoxComponent } from '../chart-box/chart-box.component';
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { SymbolModel } from "../../models/symbol.model";
import { InstrumentModel } from "../../models/instrument.model";
import { Subject } from 'rxjs';
import { ConstantsService } from '../../services/constants.service';
import { UserService } from '../../services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { CacheService } from '../../services/cache.service';
import { SYMBOL_CAT_TYPE_FOREX, SYMBOL_CAT_TYPE_RESOURCE, SYMBOL_CAT_TYPE_CRYPTO } from "../../../../../shared/constants/constants";

declare let $: any;

@Component({
	selector: 'chart-overview',
	templateUrl: './chart-overview.component.html',
	styleUrls: ['./chart-overview.component.scss'],
	// encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class ChartOverviewComponent implements OnInit, AfterViewInit, OnDestroy {

	@Output() public activeSymbol: SymbolModel;

	@ViewChildren(ChartBoxComponent) charts: QueryList<ChartBoxComponent>;
	@ViewChild('filter') filterRef: ElementRef;
	@ViewChild('list') listRef: ElementRef;

	public activeSymbol$: Subject<SymbolModel> = new Subject();
	public symbols = [];
	public activeFilter: string = 'all';
	public activeMenu: string = null;

	private _routeSub;

	constructor(
		public instrumentsService: InstrumentsService,
		public constantsService: ConstantsService,
		public userService: UserService,
		public cacheService: CacheService,
		public cd: ChangeDetectorRef,
		private _elementRef: ElementRef,
		private _route: ActivatedRoute,
		private _router: Router,
		private _orderService: OrderService,
		private applicationRef: ApplicationRef, 
		injector: Injector
	) {
		console.log(applicationRef.components[0].instance.filterClick$.subscribe(() => this.toggleFilterNav()));
		// this.appElementRef = injector.get(applicationRef.componentTypes[0]).elementRef;
	}

	ngOnInit() {
		console.log(this._route);
		this.activeSymbol = this.cacheService.getBySymbol(this._route.snapshot.queryParams['symbol']) || this.cacheService.symbols[0];
	}

	ngAfterViewInit() {
		this.symbols = this.cacheService.symbols;

		setTimeout(() => {
			this.cd.detectChanges();

			this._routeSub = this._route.queryParams.subscribe(params => {
				if (this.activeSymbol && this.activeSymbol.options.name === params['symbol']) {
					this._scrollIntoView(this.activeSymbol);
					return;
				}

				const symbol = this.cacheService.getBySymbol(params['symbol']);
				this.setActiveSymbol(undefined, symbol || this.symbols[0]);
				this._scrollIntoView(this.activeSymbol);
				this.cd.detectChanges();
			});
		}, 0);
	}

	public toggleFilterNav(event?, state?: boolean) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		this.filterRef.nativeElement.classList.toggle('show', state);
	}

	toggleActiveFilter(filter: string) {
		this.activeFilter = filter;
		this.activeMenu = null;

		this.toggleFilterNav(undefined, false);

		switch (filter) {
			case 'all':
				this.symbols = this.cacheService.symbols;
				break;
			case 'all open':
				this.symbols = this.cacheService.symbols.filter(s => !s.options.halted);
				break;
			case 'all popular':
				this.symbols = this.cacheService.symbols;
				break;
			case 'favorite':
				this.symbols = this.cacheService.symbols.filter(s => this.userService.model.options.favorites.includes(s.options.name));
				break;
			case 'forex':
				this.symbols = this.cacheService.symbols.filter(s => s.options.type === SYMBOL_CAT_TYPE_FOREX);
				break;
			case 'forex popular':
				this.symbols = this.cacheService.symbols.filter(s => s.options.type === SYMBOL_CAT_TYPE_FOREX);
				break;
			case 'crypto all':
				this.symbols = this.cacheService.symbols.filter(s => s.options.type === SYMBOL_CAT_TYPE_CRYPTO);
				break;
			case 'resources':
				this.symbols = this.cacheService.symbols.filter(s => s.options.type === SYMBOL_CAT_TYPE_RESOURCE);
				break;
		}

		this.setActiveSymbol(undefined, this.symbols[0]);
	}

	onClickToggleFavorite(event, symbol: SymbolModel) {
		event.preventDefault();
		event.stopPropagation();

		this.userService.toggleFavoriteSymbol(symbol);
	}

	onClickAlarm(event) {
		event.preventDefault();
		event.stopPropagation();

		this.activeMenu = 'alarm';
	}

	setActiveSymbol(event, symbol: SymbolModel) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		
		this.activeSymbol = symbol;
		this._router.navigate(['/charts'], { skipLocationChange: false, queryParams: { symbol: symbol.options.name } });

		const el = this._elementRef.nativeElement.querySelector(`[data-symbol=${symbol.options.name}]`);
		if (!el || isAnyPartOfElementInViewport(el))
			return

		el.scrollIntoView();
	}

	placeOrder(event, side, symbol) {
		event.preventDefault();
		event.stopPropagation();

		this._orderService.create({ symbol, side, amount: 1 });
	}

	public trackByFunc(index, item) {
		return item.options.name;
	}

	private _scrollIntoView(symbol: SymbolModel) {
		if (!symbol)
			return;

		const el = this._elementRef.nativeElement.querySelector(`[data-symbol=${symbol.options.name}]`);

		// Already in viewport
		if (!el || isAnyPartOfElementInViewport(el))
			return;

		if (el)
			el.scrollIntoView();
	}

	onSymbolChange(symbolModel: SymbolModel): void {
		this.activeSymbol = symbolModel;
	}

	addIndicator(name: string) {

	}

	ngOnDestroy() {
		if (this._routeSub)
			this._routeSub.unsubscribe();
	}
}


function isAnyPartOfElementInViewport(el) {

	const rect = el.getBoundingClientRect();
	// DOMRect { x: 8, y: 8, width: 100, height: 100, top: 8, right: 108, bottom: 108, left: 8 }
	const windowHeight = (window.innerHeight || document.documentElement.clientHeight);
	const windowWidth = (window.innerWidth || document.documentElement.clientWidth);

	// http://stackoverflow.com/questions/325933/determine-whether-two-date-ranges-overlap
	const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) >= 0);
	const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) >= 0);

	return (vertInView && horInView);
}