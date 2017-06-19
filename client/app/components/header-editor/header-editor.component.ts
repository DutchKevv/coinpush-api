import {Component, ViewChild, ViewEncapsulation} from '@angular/core';
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
	styleUrls: ['./header-editor.component.scss'],
	encapsulation: ViewEncapsulation.Native
})

export class HeaderEditorComponent {

	@ViewChild(LoginComponent) login: LoginComponent;

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
			this._socketService.send('instrument:indicator:options', {name: name}, (err, data) => {
				err ? reject(err) : resolve(new IndicatorModel(data));
			});
		});
	}

	public showIndicatorOptionsMenu(indicatorModel: IndicatorModel): Promise<boolean> {

		return new Promise((resolve) => {
		});
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
}