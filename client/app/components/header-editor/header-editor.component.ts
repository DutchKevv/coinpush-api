import {Component, ViewChild} from '@angular/core';
import {SocketService} from '../../services/socket.service';
import {LoginComponent} from '..//login/login.component';
import {UserService} from '../../services/user.service';
import {SystemService} from '../../services/system.service';
import {IndicatorModel} from '../../models/indicator';
import {forEach} from 'lodash';

declare let window: any;

@Component({
	selector: 'app-header-editor',
	templateUrl: './header-editor.component.html',
	styleUrls: ['./header-editor.component.scss']
})

export class HeaderEditorComponent {

	@ViewChild(LoginComponent) login: LoginComponent;
	_chartComponent: any;
	viewState = 'windowed';
	model = {
		data: {}
	};


	constructor(private _socketService: SocketService,
				protected socketService: SocketService,
				public userService: UserService,
				public systemService: SystemService) {
	}

	public async addIndicator(name) {
		let indicatorModel = await this.getIndicatorOptions(name),
			options = {};

		if (await this.showIndicatorOptionsMenu(indicatorModel) === false)
			return;

		// Normalize model values
		forEach(indicatorModel.inputs, input => {
			switch (input.type) {
				case 'number':
					input.value = parseInt(input.value, 10);
					break;
				case 'text':
					input.value = String.prototype.toString.call(input.value);
					break;
			}

			options[input.name] = input.value
		});

		indicatorModel.inputs = options;

		// this._chartComponent.addIndicator(indicatorModel);
	}

	public getIndicatorOptions(name: string): Promise<IndicatorModel> {
		return new Promise((resolve, reject) => {
			this._socketService.socket.emit('instrument:indicator:options', {name: name}, (err, data) => {
				err ? reject(err) : resolve(new IndicatorModel(data));
			});
		});
	}

	public showIndicatorOptionsMenu(indicatorModel: IndicatorModel): Promise<boolean> {

		return new Promise((resolve) => {

			// this._dialogAnchor.createDialog(DialogComponent, {
			// 	title: indicatorModel.name,
			// 	model: indicatorModel,
			// 	buttons: [
			// 		{value: 'add', text: 'Add', type: 'primary'},
			// 		{text: 'Cancel', type: 'default'}
			// 	],
			// 	onClickButton(value) {
			// 		if (value === 'add') {
			// 			resolve(true);
			// 		} else
			// 			resolve(false);
			// 	}
			// });
		});
	}

	public toggleViewState(viewState: string | boolean, reflow = true) {
		// let elClassList = this._elementRef.nativeElement.classList;

		if (typeof viewState === 'string') {

			// if (this.viewState !== viewState) {
			//
			// 	elClassList.remove(this.viewState);
			// 	elClassList.add(viewState);
			//
			// 	this.viewState = viewState;
			//
			// 	if (reflow) {
			// 		this._chartComponent.reflow();
			// 	}
			// }
		} else {
			// elClassList.toggle('minimized', !viewState);
		}
	}


	openCharts() {
		let url = `${location.href.split('#')[0]}#/home`,
			win;

		// Electron
		if (window.electron) {
			win = window.electron.openWindow(url, {parent: Window});
		}
		else {
			win = window.open(url, 'home');
		}
	}

	onClickLogin() {
		this.userService.login();
	}

	clearCache() {
		this.socketService.socket.emit('system:clear-cache', {}, (err: any) => {
			if (err)
				alert(err);

			alert('Cleaned cache');
		});
	}
}