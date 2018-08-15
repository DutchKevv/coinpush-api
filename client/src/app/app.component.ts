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

	public showBrowserAds = !app.platform.isApp && app.platform.adsEnabled;
	
	private _lastTimeBackPress = 0;
	private _timePeriodToExit = 2000;

	/**
	 * hide banner on keyboard show
	 * TODO - bullshit
	 * @param event 
	 */
	@HostListener('window:resize', ['$event'])
	onWindowResize(event) {
		if (!app.platform.isApp) return;

		const size = window.innerWidth + window.innerHeight;

		if (app.platform.windowW !== window.innerWidth || window.innerHeight !== app.platform.windowH) {
			document.body.classList.remove('app');
		} else {
			document.body.classList.add('app');
			// app.repositionAds();
		}
	}

	/**
	 * mobile nav menu back press close (android)
	 * TODO - should be done by router events (popstate)
	 * @param event 
	 */
	@HostListener('document:backbutton', ['$event'])
	onBackButton(event) {
		this._onClickMobileBackButton(event);

		if (history.length > historyStart)
			window.history.go(-1);
	}

	constructor(
		public userService: UserService,
		private _eventService: EventService,
		private _cacheService: CacheService,
		private _socketService: SocketService) {
		this._cacheService.init(); // cacheService must init before eventService
		this._eventService.init();
	}

	ngOnInit() {
		// initialize push messages
		app.notification.init().catch(console.error);

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