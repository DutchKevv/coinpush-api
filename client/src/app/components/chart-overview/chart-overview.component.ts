import {
	Component, OnInit, ElementRef, QueryList, ViewChildren, ChangeDetectionStrategy, ViewEncapsulation, NgZone,
	ViewChild,
	ChangeDetectorRef,
	AfterViewInit,
	Output,
	OnDestroy,
	ApplicationRef,
	DoCheck
} from '@angular/core';

import { SymbolModel } from "../../models/symbol.model";
import { Subject } from 'rxjs/Subject';
import { ConstantsService } from '../../services/constants.service';
import { UserService } from '../../services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CacheService } from '../../services/cache.service';
import { SYMBOL_CAT_TYPE_FOREX, SYMBOL_CAT_TYPE_RESOURCE, SYMBOL_CAT_TYPE_CRYPTO, CUSTOM_EVENT_TYPE_ALARM, ALARM_TRIGGER_DIRECTION_DOWN, ALARM_TRIGGER_DIRECTION_UP } from "../../../../../shared/constants/constants";
import { EventService } from '../../services/event.service';
import { NgForm } from '@angular/forms';
import { app } from '../../../assets/custom/js/core/app';

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
	public symbols = [];
	public activeFilter: string = '';
	public activeMenu: string = null;
	public activeAlarmMenu: string = null;
	public activeEvents$;
	public historyEvents$;

	public formModel: any = {
		alarmType: "1",
		alarm: {

		}
	};

	private _routeSub;
	private _filterSub;
	private _priceChangeSub;

	constructor(
		public constantsService: ConstantsService,
		public userService: UserService,
		public cacheService: CacheService,
		private eventService: EventService,
		private _changeDetectorRef: ChangeDetectorRef,
		private _elementRef: ElementRef,
		private _route: ActivatedRoute,
		private _router: Router,
		private _applicationRef: ApplicationRef
	) {

	}

	ngOnInit() {
		this._changeDetectorRef.detach();

		this._filterSub = this._applicationRef.components[0].instance.filterClick$.subscribe(() => this.toggleFilterNav());
		this._priceChangeSub = this.cacheService.changed$.subscribe(changedSymbols => this._onPriceChange(changedSymbols));

		// app.on('symbols-update', this._onSymbolUpdate, this);

		setTimeout(() => {
			if (!this._route.snapshot.queryParams['symbol'])
				this.toggleActiveFilter('rise and fall');

			this._routeSub = this._route.queryParams.subscribe(params => {
				// // if its the same as the current, do nothing
				if (this.activeSymbol && this.activeSymbol.options.name === params['symbol'])
					return;

				// only continue if symbol is known (could be old bookmark)
				if (params['symbol']) {
					const symbol = this.cacheService.getSymbolByName(params['symbol']);
					if (!symbol) {
						return;
					}

					// showing a specific symbol, so no active filter
					this.toggleActiveFilter('', false);

					// set symbol
					this.symbols = [symbol];
					this.setActiveSymbol(null, this.symbols[0]);
				} else {
					this.toggleActiveFilter('rise and fall');
				}
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

	public toggleActiveFilter(filter: string, removeSymbolFromUrl = true) {

		// remove specific symbol in url
		if (removeSymbolFromUrl && this._route.snapshot.queryParams['symbol']) {
			this._router.navigate(['/symbols'], { skipLocationChange: false, queryParams: {} });
		}

		this.activeFilter = filter;
		this.activeMenu = null;

		this.toggleFilterNav(undefined, false);

		switch (filter) {
			case 'all':
				this.symbols = this.cacheService.symbols;
				break;
			case 'all popular':
				this.symbols = this.cacheService.symbols.sort((a, b) => a.options.volume - b.options.volume).slice(-40).reverse();
				break;
			case 'rise and fall':
				const sorted = this.cacheService.symbols.sort((a, b) => a.options.changedDAmount - b.options.changedDAmount);
				this.symbols = [].concat(sorted.slice(-20).reverse(), sorted.slice(0, 20));
				break;
			case 'favorite':
				this.symbols = this.cacheService.symbols.filter(symbol => symbol.options.iFavorite);
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
			case 'crypto popular':
				this.symbols = this.cacheService.symbols
					.filter(s => s.options.type === SYMBOL_CAT_TYPE_CRYPTO)
					.sort((a, b) => a.options.volume - b.options.volume)
					.slice(-40)
					.reverse();
				break;
			case 'resources':
				this.symbols = this.cacheService.symbols.filter(s => s.options.type === SYMBOL_CAT_TYPE_RESOURCE);
				break;
			default:
				this.symbols = [];
		}

		if (this.symbols.length)
			this.setActiveSymbol(undefined, this.symbols[0]);
	}

	async onClickToggleFavorite(event, symbol: SymbolModel) {
		event.preventDefault();
		event.stopPropagation();

		await this.userService.toggleFavoriteSymbol(symbol);
		this._changeDetectorRef.detectChanges();
	}

	toggleAlarmMenuVisibility() {
		if (this.activeMenu === 'alarm') {
			this.activeMenu = this.activeAlarmMenu = null;
		} else {
			this.activeMenu = 'alarm';
			this.activeAlarmMenu = 'new'
		}
		this._changeDetectorRef.detectChanges();
	}

	toggleAlarmMenuTab(tab: string) {
		this.activeAlarmMenu = tab;
		this._changeDetectorRef.detectChanges();
	}

	setActiveSymbol(event, symbol: SymbolModel): void {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		if (symbol === this.activeSymbol) {
			this._changeDetectorRef.detectChanges();
			return;
		}

		// reset side-menu form model
		this.formModel = {
			alarmType: "1",
			amount: symbol.options.bid,
			alarm: {

			}
		};

		this.activeSymbol = symbol;

		if (this.activeEvents$ && this.activeEvents$.unsubscribe)
			this.activeEvents$.unsubscribe();

		if (this.historyEvents$ && this.historyEvents$.unsubscribe)
			this.historyEvents$.unsubscribe();

		this.activeEvents$ = this.eventService.findBySymbol(this.activeSymbol.options.name, 0, 50);
		this.historyEvents$ = this.eventService.findBySymbol(this.activeSymbol.options.name, 0, 50, true);

		this._changeDetectorRef.detectChanges();
	}

	public onCreateFormSubmit(form: NgForm) {
		if (!this.activeSymbol)
			return;

		this.formModel.symbol = this.activeSymbol.options.name;
		this.formModel.type = CUSTOM_EVENT_TYPE_ALARM;
		this.formModel.alarm.dir = this.formModel.amount < this.activeSymbol.options.bid ? ALARM_TRIGGER_DIRECTION_DOWN : ALARM_TRIGGER_DIRECTION_UP;
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
		this._changeDetectorRef.detectChanges();
	}

	public trackByFunc(index, item) {
		return item.options.name;
	}

	onSymbolChange(symbolModel: SymbolModel): void {
		this.activeSymbol = symbolModel;
	}

	private _onPriceChange(changedSymbols) {
		// this._changeDetectorRef.detectChanges();
	}

	addIndicator(name: string) {

	}

	private _priceToFixed(number) {
		if (this.activeSymbol.options.precision > 0)
			return number.toFixed(this.activeSymbol.options.precision + 1 || 4);

		let n = Math.max(Math.min(number.toString().length, 2), 6);
		return number.toFixed(n);
	}

	private _onSymbolUpdate() {
		if (!this._route.snapshot.queryParams['symbol']) {
			this.toggleActiveFilter('rise and fall')
		} else {
			const symbol = this.cacheService.getSymbolByName(this._route.snapshot.queryParams['symbol']);
			if (symbol) {
				this.symbols = [symbol];
				this.setActiveSymbol(null, symbol);
			}
		}
	}

	ngOnDestroy() {
		app.off('symbols-update', this._onSymbolUpdate);

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