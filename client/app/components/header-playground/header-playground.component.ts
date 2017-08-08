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
	selector: 'app-header-playground',
	templateUrl: './header-playground.component.html',
	styleUrls: ['./header-playground.component.scss'],
	entryComponents: [DialogComponent],
	encapsulation: ViewEncapsulation.Native
})

export class HeaderPlaygroundComponent implements OnInit {

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

		// // $(this._elementRef.nativeElement).click(() => {
		// // 	$(this._elementRef.nativeElement.shadowRoot.querySelectorAll('.dropdown-toggle')).
		// // });
		// $(document.body).on('mouseenter mouseleave', '.dropdown', (e) => {
		// 	console.log(e.target);
		// 	let el = $(e.target).closest('.dropdown').addClass('show');
		//
		// 	setTimeout(() => {
		// 		el[el.is(':hover') ? 'addClass' : 'removeClass']('show');
		// 	}, 300);
		// });
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

	onClickLogin() {
		this.userService.login();
	}

	clearCache() {
		this.socketService.send('system:clear-cache', {}, (err: any) => {
			if (err)
				alert(err);

			alert('Cleaned cache');
		});
	}
}