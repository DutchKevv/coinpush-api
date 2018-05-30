import { Component, OnInit, Output, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { AlertService } from '../../services/alert.service';
import { BehaviorSubject } from 'rxjs';

@Component({
	selector: 'app-alert',
	styleUrls: ['./alert.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: 'alert.component.html'
})

export class AlertComponent {
	@Output() public message$: BehaviorSubject<any> = new BehaviorSubject(null);

	private _timer;
	private _timeout = 6000;

	constructor(
		private alertService: AlertService,
		private _changeDetectorRef: ChangeDetectorRef
	) { }

	ngOnInit() {
		this.alertService.getMessage().subscribe(message => {
			clearTimeout(this._timer);

			this.message$.next(message);

			this._timer = setTimeout(() => {
				this.message$.next(null);
				this._changeDetectorRef.detectChanges();
			}, this._timeout);
		});
	}

	onClickClose() {
		clearTimeout(this._timer);
		this.message$.next(null);
	}
}