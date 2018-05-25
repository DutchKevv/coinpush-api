import { Component, ChangeDetectionStrategy, EventEmitter, ViewChild, Output, ElementRef, HostListener, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { HeaderComponent } from "./components/header/header.component";
import { app } from "core/app";
import { HttpClient } from "@angular/common/http";
import { UserService } from "./services/user.service";
import { EventService } from "./services/event.service";
import { CacheService } from "./services/cache.service";
import { SocketService } from "./services/socket.service";

declare let window: any;
declare let navigator: any;

const _originalSize = window.innerWidth + window.innerHeight;

@Component({
	selector: 'app',
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
			if (_originalSize !== size) {
				document.body.querySelector('app').classList.remove('app');
			} else {
				document.body.querySelector('app').classList.add('app');
				// app.repositionAds();
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
		public userService: UserService,
		private _eventService: EventService,
		private _cacheService: CacheService,
		private _socketService: SocketService) {

	}

	ngOnInit() {
		this._cacheService.init(); // cacheService must init before eventService
		this._eventService.init();
		this._socketService.connect();

		if (this.userService.model.options._id) {
			app.initNotifications().catch(console.error);
		}
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