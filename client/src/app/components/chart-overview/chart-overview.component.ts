import {
	Component, OnInit, ElementRef, QueryList, ViewChildren, ChangeDetectionStrategy, ViewEncapsulation, NgZone,
	ViewChild,
	ChangeDetectorRef,
	AfterViewInit,
	Output,
	OnDestroy,
	ApplicationRef
} from '@angular/core';

import { InstrumentsService } from '../../services/instruments.service';
import { ChartBoxComponent } from '../chart-box/chart-box.component';
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { SymbolModel } from "../../models/symbol.model";
import { InstrumentModel } from "../../models/instrument.model";
import { Subject } from 'rxjs/Subject';
import { ConstantsService } from '../../services/constants.service';
import { UserService } from '../../services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { CacheService } from '../../services/cache.service';
import { SYMBOL_CAT_TYPE_FOREX, SYMBOL_CAT_TYPE_RESOURCE, SYMBOL_CAT_TYPE_CRYPTO, CUSTOM_EVENT_TYPE_ALARM } from "../../../../../shared/constants/constants";
import { EventService } from '../../services/event.service';
import { NgForm } from '@angular/forms';

declare let $: any;

@Component({
	selector: 'chart-overview',
	templateUrl: './chart-overview.component.html',
	styleUrls: ['./chart-overview.component.scss'],
	// encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class ChartOverviewComponent implements OnInit, OnDestroy {

	@ViewChild('filter') filterRef: ElementRef;

	public activeSymbol: SymbolModel;
	public activeSymbol$: Subject<SymbolModel> = new Subject();
	public symbols = [];
	public activeFilter: string = 'all';
	public activeMenu: string = null;
	public activeAlarmMenu: string = null;
	public events$;

	public formModel: any = {
		alarmType: "1",
		alarm: {

		}
	};

	private _routeSub;
	private _filterSub;
	private _priceChangeSub;

	constructor(
		public instrumentsService: InstrumentsService,
		public constantsService: ConstantsService,
		public userService: UserService,
		public cacheService: CacheService,
		private eventService: EventService,
		public cd: ChangeDetectorRef,
		private _elementRef: ElementRef,
		private _route: ActivatedRoute,
		private _router: Router,
		private _orderService: OrderService,
		private _applicationRef: ApplicationRef
	) {
	}

	ngOnInit() {
		this._filterSub = this._applicationRef.components[0].instance.filterClick$.subscribe(() => this.toggleFilterNav());
		this._priceChangeSub = this.cacheService.changed$.subscribe(changedSymbols => this._onPriceChange(changedSymbols));

		this.symbols = this.cacheService.symbols;

		this.setActiveSymbol(undefined, this.cacheService.getBySymbol(this._route.snapshot.queryParams['symbol']) || this.cacheService.symbols[0], false);

			// setTimeout(() => {

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
		// }, 0);
	}

	public toggleFilterNav(event?, state?: boolean) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		this.filterRef.nativeElement.classList.toggle('show', state);
	}

	public toggleActiveFilter(filter: string) {
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
		if (this.activeMenu === 'alarm') {
			this.activeMenu = this.activeAlarmMenu = null;
		} else {
			this.activeMenu = 'alarm';
			this.activeAlarmMenu = 'new'
		}

	}

	onClickMore(event) {
		event.preventDefault();
		event.stopPropagation();

		event.currentTarget.parentNode.classList.toggle('open');
	}

	setActiveSymbol(event, symbol: SymbolModel, navigate: boolean = true) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		if (symbol === this.activeSymbol)
			return;

		// reset side-menu form model
		this.formModel = {
			alarmType: "1",
			amount: symbol.options.bid,
			alarm: {
				
			}
		};

		this.activeSymbol = symbol;
		this.events$ = this.eventService.findBySymbol(this.activeSymbol.options.name);

		this._router.navigate(['/charts'], { skipLocationChange: true, queryParams: { symbol: symbol.options.name } });

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

	public onCreateFormSubmit(form: NgForm) {
		if (!this.activeSymbol)
			return;

		this.formModel.symbol = this.activeSymbol.options.name;
		this.formModel.type = CUSTOM_EVENT_TYPE_ALARM;
		this.formModel.alarm.dir = this.formModel.amount < this.activeSymbol.options.bid;
		this.eventService.create(this.formModel);
	}

	public onClickSideMenuNumberInput(dir: number, inputEl: HTMLElement) {
		let newValue = this.formModel.amount || this.activeSymbol.options.bid;
		let inc = this.activeSymbol.options.bid / 700

		if (dir > 0)
			newValue += inc;
		else
			newValue -= inc;

		this.formModel.amount = parseFloat(this._priceToFixed(newValue));
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

	private _onPriceChange(changedSymbols) {
		this.cd.detectChanges();
	}

	addIndicator(name: string) {

	}

	private _priceToFixed(number) {
		if (this.activeSymbol.options.precision > 0)
			return number.toFixed(this.activeSymbol.options.precision + 1 || 4);

		let n = Math.max(Math.min(number.toString().length, 2), 6);
		return number.toFixed(n);
	}

	ngOnDestroy() {
		if (this._priceChangeSub)
			this._priceChangeSub.unsubscribe();

		if (this._filterSub)
			this._filterSub.unsubscribe();

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