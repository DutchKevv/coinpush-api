import { Component, Output, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, ViewChild, ElementRef, HostListener, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CacheService } from '../../services/cache.service';
import { Subject } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Location } from '@angular/common';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';

let historyStart = history.length;

@Component({
	selector: 'app-header',
	styleUrls: ['./header.component.scss'],
	templateUrl: 'header.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class HeaderComponent {
	@Input() public titleText$: Subject<string>;

	@Output() public filterClicked$: EventEmitter<void | boolean> = new EventEmitter(false);
	@Output() public navClicked$: EventEmitter<void | boolean> = new EventEmitter();
	@Output() public searchResults$: BehaviorSubject<any> = new BehaviorSubject(null);
	@Output() public searchOpen$: EventEmitter<boolean> = new EventEmitter();

	@ViewChild('dropdown') public dropdown: ElementRef;
	@ViewChild('input') public inputRef: ElementRef;

	public searchOpen: boolean = false;
	public showBackButton: boolean = false;
	public showFilterButton: boolean = true;

	private _routerEventsSub: any;
	private _defaultSearchResults = {
		symbols: [],
		users: []
	};

	// /**
	//  * outside click for menus auto close
	//  * @param event 
	//  */
	// @HostListener('window:click', ['$event'])
	// onWindowClick(event) {
	// 	if (event.target.id !== 'mainSearchInput' && !event.target.classList.contains('fa-search')) {
	// 		this.toggleSearch(false);
	// 		this._changeDetectorRef.detectChanges();
	// 	}
	// 	if (!event.target.classList.contains('fa-filter')) {
	// 		this.filterClicked$.emit(false);
	// 		this._changeDetectorRef.detectChanges();
	// 	}

	// 	if (this.dropdown) {
	// 		this.searchResults$.next(this._defaultSearchResults);
	// 	}
	// }

	constructor(
		private _http: HttpClient,
		private _router: Router,
		private _cacheService: CacheService,
		private _location: Location,
		private _changeDetectorRef: ChangeDetectorRef,
		private _elementRef: ElementRef
	) { }

	ngOnInit() {

		this._routerEventsSub = this._router.events.subscribe((event) => {

			if (event instanceof NavigationStart) {
				const isHome = event.url === '/' || (event.url.includes('/symbols') && event.url.split('?').length === 1);
				
				this.showBackButton = !isHome;
				this.showFilterButton = isHome || event.url.startsWith('/timeline');

				this._changeDetectorRef.detectChanges();
			}

			else if (event instanceof NavigationEnd) {

				this.searchOpen = false;
				this.filterClicked$.emit(false);
			}
		});
	}

	public onClickBackButton() {
		this._location.back();

		setTimeout(() => {
			requestAnimationFrame(() => {
				this._changeDetectorRef.detectChanges();
			})
		}, 10);
	}

	public onSearchKeyUp(event): void {
		this.toggleDropdownVisibility(true);

		const value = event.target.value.trim();

		if (!value.length) {
			this.searchResults$.next(null);
			return;
		}

		// get popular symbols
		const currentResult = {
			symbols: this._cacheService.getByText(value).sort((a, b) => b.options.volume - a.options.volume).slice(0, 5),
			channels: [],
			users: [],
		};

		this.searchResults$.next(currentResult);

		const params = new HttpParams({
			fromObject: { limit: '5', text: value }
		});

		this._http.get('/search/', { params }).subscribe((result: any) => {
			currentResult.users = result.users;
			this.searchResults$.next(currentResult);
		});
	}

	public toggleDropdownVisibility(state) {
		if (this.dropdown) {
			this.dropdown.nativeElement.classList.toggle('hidden', !state)
		}
	}

	public toggleSearch(state?: boolean) {
		this.searchOpen = typeof state === 'boolean' ? state : !this.searchOpen;
		this._elementRef.nativeElement.classList.toggle('searchOpen', this.searchOpen);

		if (this.searchOpen) {
			this.inputRef.nativeElement.focus();
		}
	}

	public closeAllMenus() {
		this.filterClicked$.emit(false);
		this.navClicked$.emit(false);
	}
}