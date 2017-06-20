import {ConstantsService} from './services/constants.service';
import {Component, ChangeDetectionStrategy, ViewEncapsulation, OnInit} from '@angular/core';
import {SocketService}  from './services/socket.service';
import {SystemService}  from './services/system.service';
import {CacheService} from './services/cache.service';

@Component({
	selector: 'body',
	template: `
		<div modalAnchor></div>
		<router-outlet></router-outlet>
	`,
	styleUrls: [
		'../node_modules/font-awesome/css/font-awesome.css',
		'./style/components/contextmenu'
		],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None
})

export class AppComponent implements OnInit {

	constructor(private _cacheService: CacheService,
				private _constantsService: ConstantsService,
				private _socketService: SocketService,
				private _systemService: SystemService) {

		_constantsService.init();
		_socketService.init();
		_systemService.init();
		_cacheService.init();
	}

	ngOnInit() {
		// Disable right mouse click
		document.body.addEventListener('contextmenu', e => e.preventDefault(), false);
	}
}