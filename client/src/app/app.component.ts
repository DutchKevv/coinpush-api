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

const _originalSize = window.innerWidth + window.innerHeight;

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
	@Output() public titleText$: Subject<string> = new Subject();

	@ViewChild(HeaderComponent) public header: ElementRef;

	public showBrowserAds = !app.platform.isApp && app.platform.adsEnabled;
	public showBackButton: boolean = false;

	private _sub: any;
	private _routerEventsSub: any;

	private _lastTimeBackPress = 0;
	private _timePeriodToExit = 2000;

	/**
	 * mobile nav menu back press close
	 * @param event 
	 */
	@HostListener('window:resize', ['$event'])
	onWindowResize(event) {
		const size = window.innerWidth + window.innerHeight;

		if (app.platform.isApp) {
			console.log('sdf', _originalSize, size);

			if (_originalSize !== size) {
				document.body.querySelector('app').classList.remove('app');
			} else {
				document.body.querySelector('app').classList.add('app');
			}
		}
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

		if (this.userService.model.options._id) {
			app.initNotifications().catch(console.error);
		}

		app.loadAds();
	}

	ngAfterViewInit() {
		app.prettyBootty.step('done');

		// // small break before loading ads and receiving for push messages
		// setTimeout(() => {
			
		// }, 1000);
	}

	ngOnChanges(values) {
		// this._changeDetectorRef.reattach();

		// setTimeout(() => {
		//   this._changeDetectorRef.detach();
		// })
	}

	private _onBackKeyDown(event) {
		// TODO - Hack
		if (!app.platform.isApp || window.location.hash !== '#/symbols')
			return;

		event.preventDefault();
		event.stopPropagation();

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