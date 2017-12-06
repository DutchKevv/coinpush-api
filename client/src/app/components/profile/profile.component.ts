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
	// encapsulation: ViewEncapsulation.Native,
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
		this.userId = this._route.snapshot.queryParams['id'];
		this.isSelf = this.userId === this.userService.model.get('user_id');

		this.user$.next(new ChannelModel({
			user_id: this.userId
		}));

		this._sub = this._route.params.subscribe(params => {
			
			const type = params['t'];
			this.userId = params['id'];
			this.isSelf = this.userId === this.userService.model.get('user_id');

			this.channelService.findByUserId(this.userId, {followers: 5, copiers: 5}).subscribe((channel: ChannelModel) => {
				// this.channelId = channel.get('_id');
				this.user$.next(channel);
			});
		});
	}

	ngOnDestroy() {
		this._sub.unsubscribe();
	}
}