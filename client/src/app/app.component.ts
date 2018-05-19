import { Component, ChangeDetectionStrategy, OnInit, Output, ViewChild, ElementRef, EventEmitter, HostListener, ChangeDetectorRef, AfterViewInit, Input, OnChanges } from '@angular/core';
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
import { UpdateService } from './services/update.service';
import { Location } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';

declare let window: any;
declare let navigator: any;

@Component({
	selector: 'app',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class AppComponent implements OnInit, AfterViewInit, OnChanges {

	@Output() public filterClicked$: EventEmitter<boolean> = new EventEmitter();
	@Output() public searchResults$: Subject<any> = new Subject();
	@Output() public searchOpen$: EventEmitter<boolean> = new EventEmitter();

	@Input() public titleText$: Subject<string> = new Subject();

	@ViewChild(HeaderComponent) public header: ElementRef;

	public version = 'v0.0.2-alpha-' + (environment.production ? 'prod' : 'dev');
	public searchOpen: boolean = false;
	public platform = app.platform;
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

	
	constructor(
		public http: HttpClient,
		public router: Router,
		public activatedRoute: ActivatedRoute,
		public userService: UserService,
		public authenticationService: AuthenticationService,
		private _changeDetectorRef: ChangeDetectorRef,
		private _eventService: EventService,
		private _updateService: UpdateService,
		private _cacheService: CacheService,
		private _socketService: SocketService) {
			
	}

	ngOnInit() {
		// this._updateService.do();
		this._cacheService.init(); // cacheService must init before eventService
		this._eventService.init();
		this._socketService.connect();

		this._routerEventsSub = this.router.events.subscribe((event) => {
			
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

		if (this.userService.model.options._id) {
			app.initNotifications().catch(console.error);
		}
	}

	ngAfterViewInit() {
		app.prettyBootty.step('done');
		
		// small break before loading ads and receiving for push messages
		setTimeout(() => {	
			app.loadAds();
		}, 1000);
	}

	ngOnChanges(values) {
		// this._changeDetectorRef.reattach();
		
		// setTimeout(() => {
		//   this._changeDetectorRef.detach();
		// })
	  }
}