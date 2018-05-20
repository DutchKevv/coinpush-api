import { Component, OnInit, Output, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, ViewChild, ElementRef, HostListener, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CacheService } from '../../services/cache.service';
import { Subject } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Location } from '@angular/common';
import { AuthenticationService } from '../../services/authenticate.service';
import { environment } from 'environments/environment';
import { app } from '../../../core/app';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';

declare let window: any;
declare let navigator: any;

@Component({
	selector: 'app-header',
	styleUrls: ['./header.component.scss'],
	templateUrl: 'header.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class HeaderComponent {
	@Input() public titleText$: Subject<string>;
	
	@Output() public filterClicked$: BehaviorSubject<void | boolean> = new BehaviorSubject(false);
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

	/**
	 * outside click for menus auto close
	 * @param event 
	 */
	@HostListener('window:click', ['$event'])
	onWindowClick(event) {
		if (event.target.id !== 'mainSearchInput' && !event.target.classList.contains('fa-search')) {
			this.toggleSearch(false);
			this._changeDetectorRef.detectChanges();
		}
		if (!event.target.classList.contains('fa-filter')) {
			this.filterClicked$.next(false);
			this._changeDetectorRef.detectChanges();
		}

		if (this.dropdown) {
			this.searchResults$.next(this._defaultSearchResults);
		}
	}

	constructor(
		private _http: HttpClient,
		private _router: Router,
		private _cacheService: CacheService,
		private _location: Location,
		private _changeDetectorRef: ChangeDetectorRef,
		private _elementRef: ElementRef
	) {}

	ngOnInit() {

		this._routerEventsSub = this._router.events.subscribe((event) => {
			
			if (event instanceof NavigationStart) {
				const isHome = event.url === '/' || event.url === '/symbols';
9
				if (isHome) {
					this.showFilterButton = true;
					this.showBackButton = false;
				} else {
					this.showFilterButton = false;
					this.showBackButton = true;
				}

				this._changeDetectorRef.detectChanges();
			}

			if (event instanceof NavigationEnd) {
				this.searchOpen = false;
				this.filterClicked$.next(false);
			}
		});
	}

	public onClickBackButton() {
		this._location.back();
		this._changeDetectorRef.detectChanges();
		setTimeout(() => {
			
		}, 0);
		// this._location.back();
	}

	public onSearchKeyUp(event): void {
		const value = event.target.value.trim();

		if (!value.length) {
			this.searchResults$.next(null);
			return;
		}

		const currentResult = {
			symbols: this._cacheService.getByText(value).slice(0, 5),
			channels: [],
			users: [],
		};

		this.toggleDropdownVisibility(true);
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
		this.filterClicked$.next(false);
		this.navClicked$.emit(false);
	}
}