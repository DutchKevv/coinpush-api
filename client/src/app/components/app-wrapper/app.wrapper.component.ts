import {Component, OnInit, Output} from '@angular/core';
import {AlertService} from '../../services/alert.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Component({
	selector: 'app-wrapper',
	styleUrls: ['./app.wrapper.component.scss'],
	templateUrl: 'app.wrapper.component.html'
})

export class AlertComponent {
	@Output() public message$: BehaviorSubject<any> = new BehaviorSubject(null);

	constructor(private alertService: AlertService) { }

	ngOnInit() {
		this.alertService.getMessage().subscribe(message => { this.message$.next(message); });
	}
}