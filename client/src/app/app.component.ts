import { Component, ChangeDetectionStrategy, EventEmitter, ViewChild, Output, ElementRef, HostListener, OnInit, ChangeDetectorRef } from "@angular/core";
import { Subject } from "rxjs";
import { HeaderComponent } from "./components/header/header.component";
import { UserService } from "./services/user.service";
import { EventService } from "./services/event.service";
import { CacheService } from "./services/cache.service";
import { SocketService } from "./services/socket.service";
import { AuthService } from "./services/auth/auth.service";
import { Router, NavigationStart, NavigationEnd } from "@angular/router";
import { NotificationService } from "./services/notification.service";
import { DeviceService } from "./services/device/device.service";
import { AdsService } from "./services/ads/ads.service";
import { ConfigService } from "./services/config/config.service";
import { IndicatorService } from "./services/indicator.service";

declare let window: any;
declare let navigator: any;

let historyStart = history.length;

@Component({
	selector: 'body',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class AppComponent implements OnInit {

	@Output() public filterClicked$: EventEmitter<boolean> = new EventEmitter();
	@Output() public searchResults$: Subject<any> = new Subject();
	@Output() public searchOpen$: EventEmitter<boolean> = new EventEmitter();
	@Output() public titleText$: Subject<string> = new Subject();

	@ViewChild(HeaderComponent) public header: ElementRef;

	private _lastTimeBackPress = 0;
	private _timePeriodToExit = 2000;
	private _routerEventsSub;

	/**
	 * hide banner on keyboard show
	 * TODO - bullshit
	 * @param event 
	 */
	@HostListener('window:resize', ['$event'])
	onWindowResize(event) {
		if (!this._configService.platform.isApp) return;

		const width = this._configService.viewport.width;
		const height = this._configService.viewport.height;

		if (width !== window.innerWidth || height !== window.innerHeight) {
			document.body.classList.remove('app');
		} else {
			document.body.classList.add('app');
			// app.repositionAds();
		}
	}

	// /**
	//  * mobile nav menu back press close (android)
	//  * TODO - should be done by router events (popstate)
	//  * @param event 
	//  */
	// @HostListener('document:backbutton', ['$event'])
	// onBackButton(event) {
	// 	this._onClickMobileBackButton(event);

	// 	if (history.length > historyStart)
	// 		window.history.go(-1);
	// }

	constructor(
		public userService: UserService,
		public authenticationService: AuthService,
		private _eventService: EventService,
		private _cacheService: CacheService,
		private _socketService: SocketService,
		private _indicatorService: IndicatorService,
		private _notificationService: NotificationService,
		private _deviceService: DeviceService,
		private _adsService: AdsService,
		private _configService: ConfigService,
		private _router: Router,
		private _changeDetectorRef: ChangeDetectorRef) {}

	ngOnInit() {
		this._configService.init();
		this._socketService.init();
		this._notificationService.init().catch(console.error);
		this._deviceService.init();
		this._adsService.init();
		this._indicatorService.init();

		this._cacheService.init();
		this._eventService.init();

		// open websocket
		this._socketService.connect();
	}

	private _onClickMobileBackButton(event) {
		if (history.length <= historyStart)
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