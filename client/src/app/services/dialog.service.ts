import {Injectable} from '@angular/core';
import {ModalAnchorDirective} from '../directives/modalanchor.directive';

interface IModal {
	showClose?: boolean;
	model?: any;
}

@Injectable()
export class DialogService {

	public directive: ModalAnchorDirective = null;

	constructor() {
	}

	init() {

	}

	create(Component: any, options?: any) {
		return this.directive.create(Component, options);
	}

	destroy(component?: any) {
		return this.directive.destroy();
	}
}