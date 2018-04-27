import { ChangeDetectionStrategy, Component, OnInit, ElementRef, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../services/user.service';
import { G_ERROR_DUPLICATE } from 'coinpush/constant';
import { LocationStrategy } from '@angular/common';

@Component({
	styleUrls: ['./confirmation-box.component.scss'],
	templateUrl: 'confirmation-box.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class ConfirmationBoxComponent implements OnInit {

	public title: string = '';
	public text: string = '';
	public buttons: Array<any> = [];

	constructor(
		public changeDetectorRef: ChangeDetectorRef,
		public activeModal: NgbActiveModal,
		private _location: LocationStrategy,
		private _userService: UserService
	) { }

	ngOnInit() {
		
	}

	destroy() {
		this.activeModal.dismiss('Cross click');
	}

	ngOnDestroy() {

	}
}