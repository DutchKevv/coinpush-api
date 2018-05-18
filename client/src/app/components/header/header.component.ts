import { Component, OnInit, Output, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, ViewChild, ElementRef, HostListener } from '@angular/core';
import { AlertService } from '../../services/alert.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CacheService } from '../../services/cache.service';
import { Subject } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Location } from '@angular/common';
import { AuthenticationService } from '../../services/authenticate.service';
import { environment } from 'environments/environment';
import { app } from '../../../core/app';

declare let window: any;
declare let navigator: any;

@Component({
	selector: 'app-header',
	styleUrls: ['./header.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: 'header.component.html'
})

export class HeaderComponent {
	@Output() public filterClick$: EventEmitter<boolean> = new EventEmitter();
	@Output() public navClicked: EventEmitter<boolean> = new EventEmitter();
	@Output() public searchResults$: Subject<any> = new Subject();
	@Output() public searchOpen$: EventEmitter<boolean> = new EventEmitter();
	
	@ViewChild('dropdown') public dropdown: ElementRef;
	@ViewChild('navbar') public navbar: ElementRef;
	@ViewChild('input') public inputRef: ElementRef;
	@ViewChild('globeContainer') globeContainerRef: ElementRef;

	public searchOpen: boolean = false;
	public showBackButton: boolean = false;
	public showFilterButton: boolean = true;

	private _sub: any;
	private _routerEventsSub: any;
	private _isNavOpen: boolean = false;
	private _navBarWidth: number = 250;
	private _navBarPosition: number = -this._navBarWidth;
	private _touchStartX = 0

	private _lastTimeBackPress = 0;
	private _timePeriodToExit = 2000;

	/**
	 * mobile nav menu back press close
	 * @param event 
	 */
	@HostListener('window:popstate', ['$event'])
	onPopState(event) {
		this.toggleNav(false);
		return false;
	}

	/**
	 * mobile nav menu back press close
	 * @param event 
	 */
	@HostListener('document:backbutton', ['$event'])
	onBackButton(event) {
		this._onBackKeyDown(event);
		window.history.go(-1);
	}

	/**
	 * outside click for searchdropdown
	 * @param event 
	 */
	@HostListener('window:click', ['$event'])
	onWindowClick(event) {
		if (event.target.id !== 'mainSearchInput' && !event.target.classList.contains('fa-search')) {
			this.toggleSearch(false);
		}

		if (this.dropdown) {
			this.searchResults$.next(null);
		}
	}

	/**
	 * mobile nav menu touch swipe
	 * @param event
	 */
	@HostListener('touchstart', ['$event'])
	onTouchStart(event) {
		if (!this._isNavOpen)
			return;

		this._touchStartX = event.touches[0].clientX;
	}

	/**
	 * mobile nav menu touch swipe
	 * @param event 
	 */
	@HostListener('touchmove', ['$event'])
	onTouchMove(event) {
		if (!this._isNavOpen)
			return;

		const diff = event.touches[0].clientX - this._touchStartX;

		this._updateNavPosition(diff * 2);
	}

	/**
	 * mobile nav menu touch swipe
	 * @param event 
	 */
	@HostListener('touchend', ['$event'])
	onTouchEnd(event) {
		if (!this._isNavOpen)
			return;

		this._touchStartX = 0;

		this.toggleNav(this._navBarPosition > -(this._navBarWidth / 2));
	}

	constructor(
		public http: HttpClient,
		private _authenticationService: AuthenticationService,
		private _cacheService: CacheService,
		private _location: Location,
		private _changeDetectorRef: ChangeDetectorRef
	) {

	}

	ngOnInit() {
	
	}

	public onSearchKeyUp(event): void {
		const value = event.target.value.trim();

		if (!value.length) {
			this.searchResults$.next();
			return;
		}

		const symbols = this._cacheService.getByText(value).slice(0, 5);

		const currentResult = {
			users: [],
			symbols: symbols,
			channels: []
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

	public onClickDropdownItem() {
		this.toggleDropdownVisibility(false);
	}

	public onClickBackButton() {
		this._location.back();
		this._changeDetectorRef.detectChanges();
		setTimeout(() => {
			
		}, 0);
		// this._location.back();
	}

	public toggleDropdownVisibility(state) {
		if (this.dropdown) {
			this.dropdown.nativeElement.classList.toggle('hidden', !state)
		}
	}

	public toggleNav(state?: boolean) {
		this.navbar.nativeElement.classList.toggle('show', state);
		this._isNavOpen = typeof state === 'boolean' ? state : !this._isNavOpen;

		this._navBarPosition = this._isNavOpen ? 0 : -this._navBarWidth;
		this.navbar.nativeElement.removeAttribute('style');
		// setTimeout(() => {
		// 	if (this._isNavOpen)
		// 		this.router.navigate(this.activatedRoute.snapshot.url, { queryParamsHandling: 'merge', queryParams: { menu: 1 }, relativeTo: this.activatedRoute })
		// 	else {
		// 		this.router.navigate(this.activatedRoute.snapshot.url, { queryParamsHandling: 'merge', queryParams: { menu: null }, replaceUrl: true, relativeTo: this.activatedRoute })
		// 	}
		// }, 0);
	}

	public toggleSearch(state?: boolean) {
		this.searchOpen = typeof state === 'boolean' ? state : !this.searchOpen;
		// this.header.nativeElement.classList.toggle('searchOpen', this.searchOpen);

		if (this.searchOpen) {
			this.inputRef.nativeElement.focus();
		}
	}

	public onClickFilter(event?, state?: boolean) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		this.searchOpen = false;
		this.filterClick$.emit(state);
	}

	public logout(): void {
		this._authenticationService.logout();
	}

	private _updateNavPosition(distance: number) {
		this._navBarPosition = Math.max(-this._navBarWidth, Math.min(0, distance));
		this.navbar.nativeElement.style.transform = `translateX(${this._navBarPosition}px)`;
	}

	private _onBackKeyDown(e) {
		// TODO - Hack
		if (!app.platform.isApp || window.location.hash !== '#/symbols')
			return;

		e.preventDefault();
		e.stopPropagation();

		if (new Date().getTime() - this._lastTimeBackPress < this._timePeriodToExit) {
			navigator.app.exitApp();
		} else {
			window.plugins.toast.showWithOptions(
				{
					message: "Press again to exit.",
					duration: "short", // which is 2000 ms. "long" is 4000. Or specify the nr of ms yourself.
					position: "bottom",
					addPixelsY: -40  // added a negative value to move it up a bit (default 0)
				}
			);

			this._lastTimeBackPress = new Date().getTime();
		}
	}
}