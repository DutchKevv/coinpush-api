import {ConstantsService} from './services/constants.service';
import {Component, AfterViewInit, ChangeDetectionStrategy, ViewEncapsulation} from '@angular/core';
import {SocketService}  from './services/socket.service';
import {SystemService}  from './services/system.service';
import {CacheService} from './services/cache.service';

@Component({
	selector: 'body',
	templateUrl: './app.component.html',
	styleUrls: [
		'./app.component.scss',

		// TODO: Move to vendor folder
		'./style/variables/_variables.scss',
		'./style/main.scss',
		'./style/helpers/spinner.scss',
		'./style/helpers/spinner-button.scss',
		'./style/helpers/three-column.scss',
		'./style/bootstrap-overwrite.scss'
	],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class AppComponent implements AfterViewInit {

	constructor(private _cacheService: CacheService,
				private _constantsService: ConstantsService,
				private _socketService: SocketService,
				private _systemService: SystemService) {

		_constantsService.init();
		_socketService.init();
		_systemService.init();
		_cacheService.init();
	}

	ngAfterViewInit() {
		// Disable right mouse click
		document.body.addEventListener('contextmenu', e => e.preventDefault(), false);
	}
}