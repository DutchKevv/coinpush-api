import {ConstantsService} from './services/constants.service';
import {Component, ChangeDetectionStrategy, ViewEncapsulation, AfterViewInit, OnInit} from '@angular/core';
import {SocketService}  from './services/socket.service';
import {SystemService}  from './services/system.service';
import {CacheService} from './services/cache.service';
import {AuthenticationService} from './services/authenticate.service';

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
		'../node_modules/font-awesome/css/font-awesome.css'
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None
})

export class AppComponent implements OnInit, AfterViewInit {

	constructor(private _cacheService: CacheService,
				private _authenticationService: AuthenticationService,
				private _constantsService: ConstantsService,
				private _socketService: SocketService,
				private _systemService: SystemService) {
	}

	ngOnInit() {
		this._socketService.init();
		this._systemService.init();

		this._cacheService.init();
		this._cacheService.loadSymbolList();
	}

	ngAfterViewInit() {

	}
}