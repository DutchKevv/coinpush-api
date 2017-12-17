import { Component, ChangeDetectionStrategy, ViewEncapsulation, AfterViewInit, OnInit, Output, ViewChild, ElementRef, EventEmitter, HostListener } from '@angular/core';
import { AuthenticationService } from "./services/authenticate.service";
import { SocketService } from "./services/socket.service";
import { CacheService } from "./services/cache.service";
import { OrderService } from "./services/order.service";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Subject } from "rxjs/Subject";
import { Router, NavigationEnd, NavigationStart } from '@angular/router';
import { UserService } from './services/user.service';
import { Http } from '@angular/http';
import { SymbolModel } from './models/symbol.model';

declare let Module: any;

@Component({
	selector: 'app',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	// encapsulation: ViewEncapsulation.None
})

export class AppComponent implements OnInit {

	@Output() public filterClick$: EventEmitter<boolean> = new EventEmitter();

	@Output() public searchResults$: Subject<any> = new Subject();
	@ViewChild('input') public input;
	@ViewChild('dropdown') public dropdown;
	@ViewChild('navbar') navbar: ElementRef;

	private _sub: any;
	private _routerEventsSub: any;
	private _isNavOpen: boolean = false;

	@HostListener('window:popstate', ['$event'])
	onPopState(event) {
		if (!this._isNavOpen)
			return;

		event.preventDefault();
		event.stopPropagation();

		this.toggleNav(undefined, false);

		return false;
	}

	constructor(
		public http: Http,
		public router: Router,
		public userService: UserService,
		public authenticationService: AuthenticationService,
		private _cacheService: CacheService) {
			// this.authenticationService.authenticate();
		 }

	ngOnInit() {
		this._routerEventsSub = this.router.events.subscribe((val) => {
			if (val instanceof NavigationEnd)
				this.toggleNav(undefined, false);
		});
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
			requestAnimationFrame(() => {
				this.dropdown.nativeElement.classList.toggle('hidden', !state)
			})
		}
	}

	public toggleNav(event?, state?: boolean) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		this.navbar.nativeElement.classList.toggle('show', state);

		this._isNavOpen = typeof state === 'boolean' ? state : !this._isNavOpen;
	}

	public onClickFilter(event?, state?: boolean) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		this.filterClick$.emit(true);
	}

	public onClickOverlay() {
		this.toggleNav(undefined, false);
	}

	public logout(): void {
		this.authenticationService.logout();
	}
}