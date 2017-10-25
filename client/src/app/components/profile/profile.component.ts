import {ChangeDetectionStrategy, Component, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, Route, Router} from '@angular/router';
import {UserService} from '../../services/user.service';
import {AlertService} from '../../services/alert.service';
import {UserModel} from '../../models/user.model';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {ChannelService} from '../../services/channel.service';
import {ChannelModel} from '../../models/channel.model';
import {Subject} from "rxjs/Subject";

@Component({
	selector: 'app-profile',
	templateUrl: './profile.component.html',
	styleUrls: ['./profile.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProfileComponent implements OnInit {

	@Output() public user$: BehaviorSubject<ChannelModel> = new BehaviorSubject(null);

	public userId: string;
	public isSelf: boolean;

	private _sub: any;

	constructor(public channelService: ChannelService,
				public router: Router,
				public userService: UserService,
				private _route: ActivatedRoute) {
	}

	ngOnInit() {
		// this.channelId = this._route.params['_value'].id;
		// this.isSelf = this.channelId === this.userService.model.get('_id');
		//
		// this.channelService.find(this.channelId).subscribe((channel: ChannelModel) => {
		// 	this.user$.next(channel);
		// });

		this._sub = this._route.params.subscribe(params => {

			const type = params['t'];
			this.userId = params['id'];
			this.isSelf = this.userId === this.userService.model.get('user_id');

			this.channelService.findByUserId(this.userId).subscribe((channel: ChannelModel) => {
				// this.channelId = channel.get('_id');
				this.user$.next(channel);
			});
		});
	}

	ngOnDestroy() {
	}
}