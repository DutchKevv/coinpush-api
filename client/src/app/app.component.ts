import { Component, ChangeDetectionStrategy, OnInit, Output, ViewChild, ElementRef, EventEmitter, HostListener, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { AuthenticationService } from "./services/authenticate.service";
import { CacheService } from "./services/cache.service";
import { Subject } from "rxjs/Subject";
import { Router, NavigationEnd, NavigationStart, ActivatedRoute } from '@angular/router';
import { UserService } from './services/user.service';
import { Http } from '@angular/http';
import { app } from '../core/app';
import { NotificationService } from './services/notification.service';

declare let Module: any;

@Component({
	selector: 'app',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class AppComponent implements OnInit, AfterViewInit {

	@Output() public filterClick$: EventEmitter<boolean> = new EventEmitter();
	@Output() public searchResults$: Subject<any> = new Subject();
	@Output() public searchOpen$: EventEmitter<boolean> = new EventEmitter();

	@ViewChild('dropdown') public dropdown;
	@ViewChild('navbar') navbar: ElementRef;
	@ViewChild('input') inputRef: ElementRef;
	@ViewChild('globeContainer') globeContainerRef: ElementRef;

	public notifications$;
	public searchOpen = false;
	public notificationOpen = false;

	private _sub: any;
	private _routerEventsSub: any;
	private _isNavOpen: boolean = false;
	private _navBarWidth: number = 250;
	private _navBarPosition: number = -this._navBarWidth;
	private _touchStartX = 0;

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
	 * outside click for searchdropdown
	 * @param event 
	 */
	@HostListener('window:click', ['$event'])
	onWindowClick(event) {
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
		public http: Http,
		public router: Router,
		public activatedRoute: ActivatedRoute,
		public userService: UserService,
		public authenticationService: AuthenticationService,
		private _changeDetectorRef: ChangeDetectorRef,
		private _notificationService: NotificationService,
		private _cacheService: CacheService) {}

	ngOnInit() {
		this.notifications$ = this._notificationService.findMany();
	}

	ngAfterViewInit() {
		setTimeout(() => {
			app.initNotifications().catch(console.error);
			app.loadAds();
		}, 2000);
	}

	public onSearchKeyUp(event): void {
		const value = event.target.value.trim();

		if (!value.length) {
			this.searchResults$.next();
			return;
		}

		const symbols = this._cacheService.getByText(value).slice(0, 5);
		// console.log(symbols);
		const currentResult = {
			users: [],
			symbols: symbols,
			channels: []
		};

		this.toggleDropdownVisibility(true);
		this.searchResults$.next(currentResult);

		this.http.get('/search/', { params: { limit: 5, text: value } }).map(res => res.json()).subscribe((result: any) => {
			currentResult.users = result.users;
			this.searchResults$.next(currentResult);
		});
	}

	public onClickDropdownItem() {
		this.toggleDropdownVisibility(false);
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

		setTimeout(() => {
			if (this._isNavOpen)
				this.router.navigate(this.activatedRoute.snapshot.url, { queryParamsHandling: 'merge', queryParams: { menu: 1 } })
			else {
				this.router.navigate(this.activatedRoute.snapshot.url, { queryParamsHandling: 'merge', queryParams: { menu: null }, replaceUrl: true })
			}
		}, 0);
	}

	public toggleSearch() {
		this.notificationOpen = false;
		this.searchOpen = !this.searchOpen;

		// wait until visible
		setTimeout(() => {
			// extra loop for android
			// requestAnimationFrame(() => {
			this.inputRef.nativeElement.focus();
			// });
		})
	}

	public onClickFilter(event?, state?: boolean) {
		this.filterClick$.emit(true);
	}

	public logout(): void {
		this.authenticationService.logout();
	}

	private _updateNavPosition(distance: number) {
		this._navBarPosition = Math.max(-this._navBarWidth, Math.min(0, distance));
		this.navbar.nativeElement.style.transform = `translateX(${this._navBarPosition}px)`;
	}
}