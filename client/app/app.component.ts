import {ConstantsService} from './services/constants.service';
declare let $: any;

import {Component, AfterViewInit, ElementRef} from '@angular/core';

import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import {SocketService}  from './services/socket.service';
import {SystemService}  from './services/system.service';

@Component({
	selector: 'body',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})

export class AppComponent implements AfterViewInit {
	socket: any;

	constructor(private element: ElementRef,
				private constantsService: ConstantsService,
				private socketService: SocketService,
				private systemService: SystemService) {

		constantsService.init();
		socketService.init();
		systemService.init();
	}

	ngAfterViewInit() {
		// Disable right mouse click
		document.body.addEventListener('contextmenu', e => e.preventDefault(), false);
	}
}