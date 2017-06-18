import {Component, EventEmitter, Input, OnInit, ViewEncapsulation} from '@angular/core';

@Component({
	selector: 'dlg',
	templateUrl: './modal.component.html',
	styleUrls: ['./modal.component.scss'],
	encapsulation: ViewEncapsulation.Native
})

export class ModalComponent implements OnInit {
	@Input() options = <any>{};

	model: any = {};

	close = new EventEmitter();
	button = new EventEmitter();

	onClickButton(value) {
		if (typeof this.options.onClickButton === 'function' && this.options.onClickButton(value) === false)
			return;

		this.button.emit(value);
		this.close.emit(value);
	}

	onClickedExit() {
		this.close.emit('event');
	}

	ngOnInit() {

	}
}

