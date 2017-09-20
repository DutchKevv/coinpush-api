import {ChangeDetectionStrategy, Component, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService} from '../../services/user.service';
import {AlertService} from '../../services/alert.service';
import {UserModel} from '../../models/user.model';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {ChannelService} from '../../services/channel.service';
import {ChannelModel} from '../../models/channel.model';

@Component({
	selector: 'app-profile',
	templateUrl: './profile.component.html',
	styleUrls: ['./profile.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProfileComponent implements OnInit {

	@Output() public user$: BehaviorSubject<ChannelModel> = new BehaviorSubject(new ChannelModel());
	loading = false;

	public userId: string;
	public channelId: string;
	public isSelf: boolean;

	private _sub: any;

	constructor(public channelService: ChannelService,
				public userService: UserService,
				private _route: ActivatedRoute) {
	}

	ngOnInit() {
		this.userId = this._route.params['_value'].id;


		this._sub = this._route.params.subscribe(params => {
			this.userId = params['id'];
			this.isSelf = this.userId === this.userService.model.get('_id');

			this.channelService.getByUserId(this.userId).subscribe((channel: ChannelModel) => {
				this.channelId = channel.get('_id');
				this.user$.next(channel);
			});
		});
	}

	ngOnDestroy() {
		this._sub.unsubscribe();
	}
}