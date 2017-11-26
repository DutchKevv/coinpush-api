import {
	Component, ChangeDetectionStrategy, ViewEncapsulation, Output, EventEmitter, OnInit,
	OnDestroy, ElementRef, AfterViewInit, ViewChild
} from '@angular/core';
import { CacheService } from '../../services/cache.service';
import { ConstantsService } from "../../services/constants.service";
import { OrderService } from "../../services/order.service";
import { SymbolModel } from "../../models/symbol.model";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { SYMBOL_CAT_TYPE_FOREX, SYMBOL_CAT_TYPE_RESOURCE } from "../../../../../shared/constants/constants";
import { UserService } from "../../services/user.service";
import { ActivatedRoute } from "@angular/router";
import { Subject } from 'rxjs';


@Component({
	selector: 'instrument-list',
	templateUrl: './instrument-list.component.html',
	styleUrls: ['./instrument-list.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstrumentListComponent implements OnInit, AfterViewInit, OnDestroy {

	@Output() activeSymbolChange = new EventEmitter<SymbolModel>();
	@ViewChild('navbar') navbar: ElementRef;

	public activeSymbol: SymbolModel;
	public activeFilter: string = 'all';
	public activeMenu: string = null;
	public symbols = this.cacheService.symbols;

	private _routeSub;

	constructor(public cacheService: CacheService,
		public constantsService: ConstantsService,
		public userService: UserService,
		private _elementRef: ElementRef,
		private _route: ActivatedRoute,
		private _orderService: OrderService) { }

	ngOnInit() {
	
	}

	ngAfterViewInit() {
		this._routeSub = this._route.params.subscribe(params => {
			if (this.activeSymbol && this.activeSymbol.options.name === params['id'])
				return;

			const symbol = this.cacheService.symbols.find(s => s.options.name === params['id']);
			this.setActiveSymbol(symbol || this.cacheService.symbols[0]);
			this._scrollIntoView(this.activeSymbol);
		});
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

	setActiveSymbol(symbol: SymbolModel) {
		this.activeSymbolChange.next(symbol);
		this.activeSymbol = symbol;
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

		const el = this._elementRef.nativeElement.shadowRoot.querySelector(`[data-symbol=${symbol.get('name')}]`);

		// Already in viewport
		if (!el || isAnyPartOfElementInViewport(el))
			return;

		if (el)
			el.scrollIntoView();
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