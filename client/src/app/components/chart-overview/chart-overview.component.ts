import {
	Component, OnInit, ElementRef, QueryList, ViewChildren, ChangeDetectionStrategy, ViewEncapsulation, NgZone,
	ViewChild,
	ChangeDetectorRef,
	AfterViewInit,
	Output
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
import { SYMBOL_CAT_TYPE_FOREX, SYMBOL_CAT_TYPE_RESOURCE } from "../../../../../shared/constants/constants";

declare let $: any;

@Component({
	selector: 'chart-overview',
	templateUrl: './chart-overview.component.html',
	styleUrls: ['./chart-overview.component.scss'],
	// encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class ChartOverviewComponent implements OnInit, AfterViewInit {

	@ViewChildren(ChartBoxComponent) charts: QueryList<ChartBoxComponent>;
	@ViewChild('container') container;

	public activeSymbol$: Subject<SymbolModel> = new Subject();
	@Output() public activeSymbol: SymbolModel;

	@ViewChild('navbar') navbar: ElementRef;
	@ViewChild('list') listRef: ElementRef;

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
		private _orderService: OrderService
	) {
	}

	ngOnInit() {
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
				// 
			});
		}, 0);
	}

	toggleFilter(filter: string) {
		this.activeFilter = filter;
		this.activeMenu = null;

		switch (filter) {
			case 'all':
				this.symbols = this.cacheService.symbols;
				break;
			case 'all open':
				this.symbols = this.cacheService.symbols.filter(s => !s.get('halted'));
				break;
			case 'all popular':
				this.symbols = this.cacheService.symbols;
				break;
			case 'favorite':
				this.symbols = this.cacheService.symbols.filter(s => this.userService.model.options.favorites.includes(s.options.name));
				break;
			case 'forex':
				this.symbols = this.cacheService.symbols.filter(s => s.get('type') === SYMBOL_CAT_TYPE_FOREX);
				break;
			case 'forex pop':
				this.symbols = this.cacheService.symbols.filter(s => s.get('type') === SYMBOL_CAT_TYPE_FOREX);
				break;
			case 'resources':
				this.symbols = this.cacheService.symbols.filter(s => s.get('type') === SYMBOL_CAT_TYPE_RESOURCE);
				break;
		}
	}

	onClickToggleFavorite(event, symbol: SymbolModel) {
		event.preventDefault();
		event.stopPropagation();

		this.userService.toggleFavoriteSymbol(symbol);
	}

	setActiveSymbol(event, symbol: SymbolModel) {
		this.activeSymbol = symbol;
		console.log(symbol);
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		this._router.navigate(['/charts'], { skipLocationChange: false, queryParams: { symbol: symbol.options.name } });

		const el = this._elementRef.nativeElement.querySelector(`[data-symbol=${symbol.get('name')}]`);
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

	public collapseNav(event?, state?: boolean) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		this.navbar.nativeElement.classList.toggle('show', state);
	}

	private _scrollIntoView(symbol: SymbolModel) {
		if (!symbol)
			return;

		const el = this._elementRef.nativeElement.querySelector(`[data-symbol=${symbol.options.name}]`);
		console.log('asdfasdsdf', el);
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

	/*tileWindows() {
		this._zone.runOutsideAngular(() => {

			let containerW = this.container.nativeElement.clientWidth,
				containerH = this.container.nativeElement.clientHeight,
				size = Math.floor(this._getTileSize(containerW, containerH, this.charts.length)),
				columnCounter = 0,
				rowCount = 0;

			// First set the size of the box, but wait with rendering,
			// This is to give a 'snappy' feeling (re-rendering the charts is pretty slow)
			this.charts.forEach((chart) => {
				if (chart.viewState === 'minimized')
					return;

				chart.setStyles({
					x: columnCounter * size,
					y: rowCount * size,
					w: size,
					h: size
				}, true);

				if ((++columnCounter + 1) * size > containerW) {
					columnCounter = 0;
					rowCount++;
				}
			});
		});
	}*/

	/*setFocusToHighestIndex(): void {
		if (!this.charts)
			return;

		let highest = 1,
			ref = this.charts.first;

		this.charts.forEach(chart => {
			if (chart.$el[0].style.zIndex > highest)
				ref = chart;
		});

		// this.toggleFocused(ref);
	}*/

	/*private _getTileSize(width, height, number) {
		let area = height * width,
			elementArea = Math.round(area / number);

		// Calculate side length if there is no "spill":
		let sideLength = Math.round(Math.sqrt(elementArea));

		// We now need to fit the squares. Let's reduce the square size
		// so an integer number fits the width.
		let numX = Math.ceil(width / sideLength);
		sideLength = width / numX;
		while (numX <= number) {
			// With a bit of luck, we are done.
			if (Math.floor(height / sideLength) * numX >= number) {
				// They all fit! We are done!
				return sideLength;
			}
			// They don't fit. Make room for one more square i each row.
			numX++;
			sideLength = width / numX;
		}
		// Still doesn't fit? The window must be very wide
		// and low.
		sideLength = height;
		return sideLength;
	}*/
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