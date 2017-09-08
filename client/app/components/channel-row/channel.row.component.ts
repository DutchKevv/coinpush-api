import {ChangeDetectionStrategy, Component, Input, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService} from '../../services/user.service';
import {AlertService} from '../../services/alert.service';
import {UserModel} from '../../models/user.model';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Component({
	selector: 'app-channel-row',
	templateUrl: './channel.row.component.html',
	styleUrls: ['./channel.row.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class ChannelRowComponent implements OnInit {

	@Input() model;

	constructor(
		private _route: ActivatedRoute,
		private _userService: UserService,
		private alertService: AlertService) { }

	ngOnInit() {

	}
}