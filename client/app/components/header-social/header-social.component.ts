import {Component, ElementRef, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {SocketService} from '../../services/socket.service';
import {LoginComponent} from '..//login/login.component';
import {UserService} from '../../services/user.service';
import {SystemService} from '../../services/system.service';
import {DialogComponent} from '../dialog/dialog.component';
import {InstrumentsService} from '../../services/instruments.service';

declare let window: any;
declare let $: any;

@Component({
	selector: 'app-header-social',
	templateUrl: './header-social.component.html',
	styleUrls: ['./header-social.component.scss'],
	entryComponents: [DialogComponent],
	encapsulation: ViewEncapsulation.Native
})

export class HeaderSocialComponent implements OnInit {

	@ViewChild(LoginComponent) login: LoginComponent;

	model = {
		data: {}
	};

	constructor(public instrumentsService: InstrumentsService,
				protected socketService: SocketService,
				public userService: UserService,
				public systemService: SystemService,
				private _elementRef: ElementRef) {
	}

	ngOnInit() {
		$(this._elementRef.nativeElement.shadowRoot.querySelectorAll('.dropdown')).dropdown2();
	}

	public zoom(step) {
		let focusModel = this.instrumentsService.getFocused();

		if (!focusModel)
			return;

		focusModel.setZoom(step);
	}

	public async addIndicator(name) {
		alert('sdsdf');
		this.instrumentsService.addIndicator(this.instrumentsService.getFocused(), name);
	}

	openEditor() {
		let url = `${location.href.split('#')[0]}#/editor`,
			win;

		// Electron
		if (window.electron) {
			win = window.electron.openWindow(url, {parent: Window});
		}
		else {
			win = window.open(url, 'editor');
		}
	}

	openPlayground() {
		let url = `${location.href.split('#')[0]}#/playground`,
			win;

		// Electron
		if (window.electron) {
			win = window.electron.openWindow(url, {parent: Window});
		}
		else {
			win = window.open(url, 'editor');
		}
	}
}