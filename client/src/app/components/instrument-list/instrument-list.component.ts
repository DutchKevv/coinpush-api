import {
	Component, OnInit, ElementRef, ChangeDetectionStrategy,
	ViewChild,
	ChangeDetectorRef,
	OnDestroy,
	ApplicationRef,
	ViewEncapsulation,
	Pipe,
	PipeTransform
} from '@angular/core';
import { CacheService } from '../../services/cache.service';
import { UserService } from '../../services/user.service';
import { SymbolModel } from '../../models/symbol.model';
import { SymbolListService } from '../../services/symbol-list.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SYMBOL_CAT_TYPE_RESOURCE, SYMBOL_CAT_TYPE_CRYPTO, BROKER_GENERAL_TYPE_OANDA, BROKER_GENERAL_TYPE_CC } from 'coinpush/src/constant';
import { EventService } from '../../services/event.service';
import { StorageService } from '../../services/storage.service';
import { AccountService } from '../../services/account/account.service';

const DEFAULT_FILTER_POPULAR_LENGTH = 40;

@Pipe({ name: 'filterIFavorite' })
export class FilterIFavoritePipe implements PipeTransform {
	transform(symbols: Array<SymbolModel>): Array<SymbolModel> {
		return symbols.filter(symbol => symbol.options.iFavorite);
	}
}

@Component({
	selector: 'app-instrument-list',
	templateUrl: './instrument-list.component.html',
	styleUrls: ['./instrument-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None
})

export class InstrumentListComponent implements OnInit, OnDestroy {

	@ViewChild('filter') filterRef: ElementRef;

	public alarmButtonClicked$;
	public filterGroups: Array<any>;
	public activeFilter: string = '';

	private _routeSub;
	private _filterSub;
	private _activeSymbolSub;

	constructor(
		public eventService: EventService,
		public cacheService: CacheService,
		public symbolListService: SymbolListService,
		private _applicationRef: ApplicationRef,
		private _accountService: AccountService,
		private _storageService: StorageService,
		private _router: Router,
		private _route: ActivatedRoute,
		private _elementRef: ElementRef
	) {}

	async ngOnInit() {
		this.filterGroups = this._setFilterOptions();
		this._filterSub = this._applicationRef.components[0].instance.filterClicked$.subscribe(state => this._toggleFilterNav(null, state));

		// update header on selected symbol
		this._activeSymbolSub = this.symbolListService.activeSymbol$.subscribe((symbol: SymbolModel) => this._onActiveSymbolChange(symbol));

		// apend list container to component
		this._elementRef.nativeElement.appendChild(this.symbolListService.containerEl);

		const localConfig = await this._storageService.getAccountData();

		if (localConfig && localConfig.chartConfig) {
			// check if still valid filter (could be old from localstorage)
			if (!!this._getFilterObjectByName(localConfig.chartConfig.filter)) {
				this.activeFilter = localConfig.chartConfig.filter;
			}
		}

		this._routeSub = this._route.queryParams.subscribe(params => {
			const symbolName = params['symbol'];

			// only continue if symbol is known (could be old bookmark)
			if (symbolName) {

				// if its the same as the current, do nothing
				const activeSymbol = this.symbolListService.activeSymbol$.getValue();
				if (activeSymbol && activeSymbol.options.name === symbolName)
					return;

				const symbol = this.cacheService.getSymbolByName(symbolName);

				// unknown symbol, so go back to default overview
				if (!symbol) {
					this.toggleActiveFilter(this.filterGroups[0].items[0].key)
					return;
				}

				this.toggleActiveFilter('', false)

				// set symbol
				this.symbolListService.build([symbol], true);
				this.symbolListService.toggleActive(true, symbol, undefined, true);
			} else {
				this.toggleActiveFilter(this.activeFilter || this.filterGroups[0].items[0].key);
			}
		});

	}

	public async toggleActiveFilter(filter: string, removeSymbolFromUrl = true) {
		// if (filter === this.activeFilter)
		// 	return;

		const account = this._accountService.account$.getValue();
		
		if (!account.chartConfig || account.chartConfig.filter !== filter) {
			this._accountService.update({ chartConfig: { filter } }).catch(console.error);
		}

		// remove specific symbol in url
		if (removeSymbolFromUrl && this._route.snapshot.queryParams['symbol']) {
			this._router.navigate(['/symbols'], { skipLocationChange: false, queryParams: {} });
		}

		this.activeFilter = filter;

		// this.toggleFilterNav(undefined, false);
		let symbols = [];

		switch (filter) {
			case 'all':
				symbols = this.cacheService.symbols;
				break;
			case 'alarm':
				const events = this.eventService.events$.getValue();
				symbols = this.cacheService.symbols.filter(symbol => events.some(eventModel => eventModel.symbol === symbol.options.name));
				break;
			case 'all popular':
				const sorted = this.cacheService.symbols.sort((a, b) => a.options.volume - b.options.volume).reverse()
				const cc = sorted.filter(symbol => symbol.options.broker === BROKER_GENERAL_TYPE_CC).slice(0, DEFAULT_FILTER_POPULAR_LENGTH / 2);
				const oanda = sorted.filter(symbol => symbol.options.broker === BROKER_GENERAL_TYPE_OANDA).slice(0, DEFAULT_FILTER_POPULAR_LENGTH / 2);

				const mixedArr = [];
				let max = cc.length + oanda.length;
				let i2 = 0;
				for (let i = 0; i < max; i += 2) {
					mixedArr[i] = cc[i2];
					mixedArr[i + 1] = oanda[i2++];
				}
				symbols = mixedArr;
				break;
			case 'rise and fall':
				const sortedByDayAmount = this.cacheService.symbols.sort((a, b) => a.options.changedDAmount - b.options.changedDAmount);
				symbols = [].concat(sortedByDayAmount.slice(-(DEFAULT_FILTER_POPULAR_LENGTH / 2)).reverse(), sortedByDayAmount.slice(0, DEFAULT_FILTER_POPULAR_LENGTH / 2));
				break;
			case 'favorite':
				symbols = this.cacheService.symbols.filter(symbol => symbol.options.iFavorite);
				break;
			case 'forex':
				symbols = this.cacheService.symbols.filter(s => s.options.broker === BROKER_GENERAL_TYPE_OANDA);
				break;
			case 'forex popular':
				symbols = this.cacheService.symbols
					.filter(s => s.options.broker === BROKER_GENERAL_TYPE_OANDA)
					.sort((a, b) => a.options.volume - b.options.volume)
					.slice(-DEFAULT_FILTER_POPULAR_LENGTH)
					.reverse();
				break;
			case 'crypto all':
				symbols = this.cacheService.symbols.filter(s => s.options.type === SYMBOL_CAT_TYPE_CRYPTO);
				break;
			case 'crypto popular':
				symbols = this.cacheService.symbols
					.filter(s => s.options.type === SYMBOL_CAT_TYPE_CRYPTO)
					.sort((a, b) => a.options.volume - b.options.volume)
					.slice(-DEFAULT_FILTER_POPULAR_LENGTH)
					.reverse();
				break;
			case 'resources':
				symbols = this.cacheService.symbols.filter(s => s.options.type === SYMBOL_CAT_TYPE_RESOURCE);
				break;
			case 'resources popular':
				symbols = this.cacheService.symbols
					.filter(s => s.options.type === SYMBOL_CAT_TYPE_RESOURCE)
					.sort((a, b) => a.options.volume - b.options.volume)
					.slice(-DEFAULT_FILTER_POPULAR_LENGTH)
					.reverse();
				break;
			default:
				symbols = [];
		}

		this.symbolListService.toggleActive(false, undefined, undefined, true);
		this.symbolListService.build(symbols, true);
		this._updateHeaderTitle();
		// this._changeDetectorRef.detectChanges();
	}

	private _setFilterOptions() {
		this.filterGroups = [
			{
				name: 'Popular',
				items: [
					{
						key: 'all popular',
						displayName: 'All popular',
						length: DEFAULT_FILTER_POPULAR_LENGTH
					},
					{
						key: 'rise and fall',
						displayName: 'Risers and fallers',
						length: DEFAULT_FILTER_POPULAR_LENGTH
					},
					{
						key: 'favorite',
						displayName: 'My favorites',
						// length: this.cacheService.symbols.filter(symbol => symbol.options.iFavorite).length
					},
					{
						key: 'alarm',
						displayName: 'My alarms'
					},
					{
						key: 'all',
						displayName: 'All',
						length: this.cacheService.symbols.length
					}
				],
			},
			{
				name: 'Crypto',
				items: [
					{
						key: 'crypto all',
						displayName: 'All crypto',
						length: this.cacheService.symbols.filter(s => s.options.type === SYMBOL_CAT_TYPE_CRYPTO).length

					},
					{
						key: 'crypto popular',
						displayName: 'Popular crypto',
						length: DEFAULT_FILTER_POPULAR_LENGTH
					}
				]
			},
			{
				name: 'Forex',
				items: [
					{
						key: 'forex',
						displayName: 'All forex',
						length: this.cacheService.symbols.filter(s => s.options.broker === BROKER_GENERAL_TYPE_OANDA).length
					},
					{
						key: 'forex popular',
						displayName: 'Popular forex',
						length: DEFAULT_FILTER_POPULAR_LENGTH
					}
				]
			},
			{
				name: 'Resources',
				items: [
					{
						key: 'resources',
						displayName: 'All resources',
						length: this.cacheService.symbols.filter(s => s.options.type === SYMBOL_CAT_TYPE_RESOURCE).length
					},
					{
						key: 'resources popular',
						displayName: 'Popular resourcer',
						length: this.cacheService.symbols.filter(s => s.options.type === SYMBOL_CAT_TYPE_RESOURCE).length
					}
				]
			}
		];

		return this.filterGroups;
	}

	private _onActiveSymbolChange(symbolModel: SymbolModel) {
		this._updateHeaderTitle();
		this._elementRef.nativeElement.parentNode.classList.toggle('active-symbol', !!symbolModel)
	}

	private _updateHeaderTitle() {
		// set header title by symbol
		if (this.symbolListService.activeSymbol) {
			this._applicationRef.components[0].instance.titleText$.next(this.symbolListService.activeSymbol.options.displayName)
		}

		// set header title by active filter
		else if (this.activeFilter) {
			const filter = this._getFilterObjectByName(this.activeFilter);

			if (filter) {
				this._applicationRef.components[0].instance.titleText$.next(filter.displayName);
			}
		}
	}

	private _toggleFilterNav(event?, state?: boolean) {
		this.filterRef.nativeElement.classList.toggle('show', state);
	}

	private _getFilterObjectByName(filterName: string) {
		for (let i = 0; i < this.filterGroups.length; i++) {
			for (let k = 0; k < this.filterGroups[i].items.length; k++) {
				if (this.filterGroups[i].items[k].key === filterName) {
					return this.filterGroups[i].items[k];
				}
			}
		}
	}

	ngOnDestroy() {
		this._applicationRef.components[0].instance.titleText$.next('');

		if (this._activeSymbolSub) {
			this._activeSymbolSub.unsubscribe();
		}

		if (this._filterSub)
			this._filterSub.unsubscribe();

		// remove list container from component
		if (this.symbolListService.containerEl.parentNode) {
			this.symbolListService.containerEl.parentNode.removeChild(this.symbolListService.containerEl);
		}
	}
}