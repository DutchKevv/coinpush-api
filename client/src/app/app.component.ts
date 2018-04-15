import { Component, ChangeDetectionStrategy, OnInit, Output, ViewChild, ElementRef, EventEmitter, HostListener, ChangeDetectorRef, AfterViewInit, Input } from '@angular/core';
import { AuthenticationService } from "./services/authenticate.service";
import { CacheService } from "./services/cache.service";
import { Subject } from "rxjs/Subject";
import { Router, NavigationEnd, NavigationStart, ActivatedRoute } from '@angular/router';
import { UserService } from './services/user.service';
import { app } from '../core/app';
import { EventService } from './services/event.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { SocketService } from './services/socket.service';
import { environment } from '../environments/environment';

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

	@Input() public titleText$: Subject<string> = new Subject();

	@ViewChild('dropdown') public dropdown;
	@ViewChild('navbar') navbar: ElementRef;
	@ViewChild('input') inputRef: ElementRef;
	@ViewChild('globeContainer') globeContainerRef: ElementRef;

	public version = 'v0.0.2-alpha-' + (environment.production ? 'prod' : 'dev');
	public searchOpen = false;
	public platform = app.platform;

	private _sub: any;
	private _routerEventsSub: any;
	private _isNavOpen: boolean = false;
	private _navBarWidth: number = 250;
	private _navBarPosition: number = -this._navBarWidth;
	private _touchStartX = 0

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
		public http: HttpClient,
		public router: Router,
		public activatedRoute: ActivatedRoute,
		public userService: UserService,
		public authenticationService: AuthenticationService,
		private _changeDetectorRef: ChangeDetectorRef,
		private _eventService: EventService,
		private _cacheService: CacheService,
		private _socketService: SocketService) {
		// this._changeDetectorRef.detach();
	}

	ngOnInit() {
		this._cacheService.init(); // cacheService must init before eventService
		this._eventService.init();
		this._socketService.connect();

		this._routerEventsSub = this.router.events.subscribe((val) => {
			if (val instanceof NavigationEnd) {
				this.searchOpen = false;
				this.filterClick$.emit(false);
			}
		});

		if (this.userService.model.options._id) {
			app.initNotifications().catch(console.error);				
		}
	}

	ngAfterViewInit() {
		// small break before loading ads and receiving for push messages
		setTimeout(() => {
			app.prettyBootty.step('done');
			app.loadAds();
		}, 100);
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
				this.router.navigate(this.activatedRoute.snapshot.url, { queryParamsHandling: 'merge', queryParams: { menu: 1 }, relativeTo: this.activatedRoute })
			else {
				this.router.navigate(this.activatedRoute.snapshot.url, { queryParamsHandling: 'merge', queryParams: { menu: null }, replaceUrl: true, relativeTo: this.activatedRoute })
			}
		}, 0);
	}

	public toggleSearch() {
		this.searchOpen = !this.searchOpen;

		// wait until visible
		setTimeout(() => this.inputRef.nativeElement.focus())
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
		this.authenticationService.logout();
	}

	private _updateNavPosition(distance: number) {
		this._navBarPosition = Math.max(-this._navBarWidth, Math.min(0, distance));
		this.navbar.nativeElement.style.transform = `translateX(${this._navBarPosition}px)`;
	}
}