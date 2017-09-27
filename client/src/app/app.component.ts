import {Component, ChangeDetectionStrategy, ViewEncapsulation, AfterViewInit, OnInit} from '@angular/core';
import {SocketService}  from './services/socket.service';
import {CacheService} from './services/cache.service';
import {UserService} from './services/user.service';

declare let Module: any;

@Component({
	selector: 'app',
	template: `
		<div modalAnchor></div>
        <app-alert></app-alert>
		<router-outlet></router-outlet>
	`,
	styleUrls: [
		'./app.component.scss',
		'../../node_modules/font-awesome/css/font-awesome.css'
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None
})

export class AppComponent implements OnInit, AfterViewInit {

	constructor(private _cacheService: CacheService,
				private _userService: UserService,
				private _socketService: SocketService) {

		this._socketService.init();
		this._userService.init();
		this._cacheService.init();
		this._cacheService.loadSymbolList();
	}

	ngOnInit() {

	}

	ngAfterViewInit() {

	}
}