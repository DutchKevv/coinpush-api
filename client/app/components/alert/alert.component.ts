import {Component, OnInit, Output} from '@angular/core';
import {AlertService} from '../../services/alert.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Component({
	selector: 'app-alert',
	styleUrls: ['./alert.component.scss'],
	templateUrl: 'alert.component.html'
})

export class AlertComponent {
	@Output() public message$: BehaviorSubject<any> = new BehaviorSubject(null);

	constructor(private alertService: AlertService) { }

	ngOnInit() {
		this.alertService.getMessage().subscribe(message => { this.message$.next(message); });
	}
}