import {Component, ChangeDetectionStrategy, ViewEncapsulation, AfterViewInit, OnInit, Output} from '@angular/core';
import {AuthenticationService} from "./services/authenticate.service";
import {SocketService} from "./services/socket.service";
import {CacheService} from "./services/cache.service";
import {OrderService} from "./services/order.service";
import {BehaviorSubject} from "rxjs/BehaviorSubject";

declare let Module: any;

@Component({
	selector: 'app',
	template: `
		<div modalAnchor></div>
		<app-alert></app-alert>
		<router-outlet *ngIf="(ready$ | async) === true"></router-outlet>
	`,
	styleUrls: [
		'./app.component.scss',
		'../../node_modules/font-awesome/css/font-awesome.css'
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None
})

export class AppComponent implements OnInit {

	@Output() public ready$: BehaviorSubject<boolean> = new BehaviorSubject(false);

	constructor(public authenticationService: AuthenticationService,
				private _socketService: SocketService,
				private _cacheService: CacheService,
				private _orderService: OrderService
	) {

	}

	ngOnInit() {
		this.authenticationService.loggedIn$.subscribe(async state => {
			if (state) {
				await this.loadAppData();
				this.ready$.next(true);
			}
		});
	}

	public async loadAppData() {
		this._socketService.connect();
		await this._cacheService.load();
		await this._orderService.load();
	}

	public async unloadAppData() {
		// this._socketService.disconnect();
	}
}