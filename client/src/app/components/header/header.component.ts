import { Component, OnInit, Output, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, ViewChild, ElementRef, HostListener, Input } from '@angular/core';
import { AlertService } from '../../services/alert.service';
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
	@Input() public titleText$: Subject<string> = new Subject();
	
	@Output() public filterClicked$: EventEmitter<void | boolean> = new EventEmitter();
	@Output() public navClicked$: EventEmitter<void | boolean> = new EventEmitter();
	@Output() public searchResults$: Subject<any> = new Subject();
	@Output() public searchOpen$: EventEmitter<boolean> = new EventEmitter();
	
	@ViewChild('dropdown') public dropdown: ElementRef;
	@ViewChild('input') public inputRef: ElementRef;

	public searchOpen: boolean = false;
	public showBackButton: boolean = false;
	public showFilterButton: boolean = true;

	private _routerEventsSub: any;

	/**
	 * outside click for searchdropdown
	 * @param event 
	 */
	@HostListener('window:click', ['$event'])
	onWindowClick(event) {
		// this.closeAllMenus();

		if (event.target.id !== 'mainSearchInput' && !event.target.classList.contains('fa-search')) {
			this.toggleSearch(false);
		}
		if (!event.target.classList.contains('fa-filter')) {
			this.filterClicked$.next(false);
		}

		if (this.dropdown) {
			this.searchResults$.next(null);
		}
	}

	constructor(
		public http: HttpClient,
		private _router: Router,
		private _cacheService: CacheService,
		private _location: Location,
		private _changeDetectorRef: ChangeDetectorRef,
		private _elementRef: ElementRef
	) {}

	ngOnInit() {

		this._routerEventsSub = this._router.events.subscribe((event) => {
			
			if (event instanceof NavigationStart) {
				const route = event.url.split('?')[0];

				if (['/', '/symbols'].includes(route)) {
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
				this.filterClicked$.emit(false);
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
			this.searchResults$.next();
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

		this.http.get('/search/', { params }).subscribe((result: any) => {
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

	// public onClickFilter(event?, state?: boolean) {
	// 	if (event) {
	// 		event.preventDefault();
	// 		event.stopPropagation();
	// 	}

	// 	this.searchOpen = false;
	// 	this.filterClicked$.emit(state);
	// }

	public closeAllMenus() {
		this.filterClicked$.emit(false);
		this.navClicked$.emit(false);
	}
}