import {ChangeDetectionStrategy, Component, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {UserService} from '../../services/user.service';
import {AlertService} from '../../services/alert.service';
import {UserModel} from '../../models/user.model';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Http} from '@angular/http';
import {ChannelModel} from '../../models/channel.model';

@Component({
	selector: 'app-profile-channel-overview',
	templateUrl: './profile.channel.overview.component.html',
	styleUrls: ['./profile.channel.overview.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProfileChannelOverviewComponent implements OnInit {

	@Output() public model$: BehaviorSubject<[]> = new BehaviorSubject(new UserModel());
	@Output() public customChannels: BehaviorSubject<[]> = new BehaviorSubject(new UserModel());
	loading = false;

	private _id: number;
	private _sub: any;

	constructor(
		private _http: Http,
		private alertService: AlertService) { }

	ngOnInit() {

		this._http.get('/channel', {params: {type: 'profile-overview'}}).map((res: Response) => res.json()).subscribe(data => {
			console.log('CHANNELS!!!!', data);
			const model = new ChannelModel(data);
		});
	}
}