import {ConstantsService} from './services/constants.service';
import {Component, ChangeDetectionStrategy, ViewEncapsulation, AfterViewInit, OnInit} from '@angular/core';
import {SocketService}  from './services/socket.service';
import {SystemService}  from './services/system.service';
import {CacheService} from './services/cache.service';
import {simulateBackspace} from '../assets/custom/js/backspace-fix';

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
				private _constantsService: ConstantsService,
				private _socketService: SocketService,
				private _systemService: SystemService) {
	}

	ngOnInit() {
		this._cacheService.init();
		this._cacheService.loadSymbolList();
	}

	ngAfterViewInit() {
		document.body.addEventListener('contextmenu', e => e.preventDefault(), false);

		this._constantsService.init();
		this._socketService.init();
		this._systemService.init();


		const keyCodes = [37, 38, 39, 40];

		$(document).on('keydown', e => {
			// Backspace
			if (e.keyCode === 8) {
				const target = e.originalEvent['path'][0];

				if (target.nodeName.toLowerCase() === 'input') {
					simulateBackspace(target);
				}
			}

			if (keyCodes.includes(e.keyCode) && Module.custom.getFocused())
				return false;
		});
	}
}