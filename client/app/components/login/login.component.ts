import {Component, AfterViewInit, ElementRef, ViewEncapsulation} from '@angular/core';

@Component({
	selector: 'login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss'],
	encapsulation: ViewEncapsulation.Native
})

export class LoginComponent implements AfterViewInit {
	public isLoading = true;

	public options: any = {
		buttons: {

		},
		model: {
			broker: 'oanda'
		}
	};


	constructor(public elementRef: ElementRef) {

	}

	ngAfterViewInit() {
	}

	onClickButton(value) {
		if (typeof this.options.onClickButton === 'function' && this.options.onClickButton(value) === false)
			return;
	}

	async onSubmit(event: Event) {
		event.preventDefault();

		this.isLoading = true;

		// let result = await this._userService.login();
		//
		// this.isLoading = false;
		//
		// console.log('LOGIN RESULT', result);
	}
}