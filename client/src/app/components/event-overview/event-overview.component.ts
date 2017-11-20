import {
	ChangeDetectionStrategy, Component, ElementRef, Host, Input, NgZone, OnInit, Output, Pipe, PipeTransform,
	ViewEncapsulation
} from '@angular/core';
import { UserService } from '../../services/user.service';
import { Http } from '@angular/http';
import { BehaviorSubject } from 'rxjs';

@Component({
	selector: 'app-event-overview',
	styleUrls: ['./event-overview.component.scss'],
	templateUrl: 'event-overview.component.html',
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventOverviewComponent implements OnInit {

	@Output() comments$: BehaviorSubject<Array<any>> = new BehaviorSubject([]);

	constructor(
		public userService: UserService) {
	}

	ngOnInit() {
		
	}
}