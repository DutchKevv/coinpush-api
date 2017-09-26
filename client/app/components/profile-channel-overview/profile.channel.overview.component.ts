import {ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation} from '@angular/core';
import {AlertService} from '../../services/alert.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Response, Http} from '@angular/http';
import {ChannelModel} from '../../models/channel.model';
import {ActivatedRoute, RoutesRecognized} from '@angular/router';
import {CHANNEL_TYPE_MAIN} from '../../../../shared/constants/constants';
import {ChannelService} from '../../services/channel.service';
import {UserService} from '../../services/user.service';
import {ModalService} from '../../services/modal.service';
import {DialogComponent} from '../dialog/dialog.component';
import {ChannelDetailsModalComponent} from '../channel-details-modal/channel.details.modal.component';

@Component({
	selector: 'app-profile-channel-overview',
	templateUrl: './profile.channel.overview.component.html',
	styleUrls: ['./profile.channel.overview.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProfileChannelOverviewComponent implements OnInit, OnDestroy {

	@Output() public combinedChannel$: BehaviorSubject<ChannelModel> = new BehaviorSubject(new ChannelModel());
	@Output() public customChannels$: BehaviorSubject<ChannelModel[]> = new BehaviorSubject([]);

	@ViewChild('addChannelOptions') addChannelOptions: ElementRef;

	public addModel = new ChannelModel();
	public isSelf = false;

	private _id: number;
	private _sub: any;

	constructor(private _channelService: ChannelService,
				private _modalService: ModalService,
				private _alertService: AlertService,
				private _userService: UserService,
				private _route: ActivatedRoute,
				private _http: Http) {
	}

	ngOnInit() {
		this._sub = this._route.parent.params.subscribe(params => {
			this._id = params.id;
			this.isSelf = this._userService.model.get('user_id') === this._id;

			this.loadChannels();
		});
	}

	public loadChannels() {
		this._http.get('/channel/', {params: {user: this._id, custom: true}}).map((res: Response) => res.json()).subscribe(data => {
			const models = data.user.map(channel => new ChannelModel(channel));

			this.combinedChannel$.next(models.find(channel => channel.get('type') === CHANNEL_TYPE_MAIN));
			this.customChannels$.next(models.filter(channel => channel.get('type') !== CHANNEL_TYPE_MAIN));
		});
	}

	onClickAddChannel() {
		this.addChannelOptions.nativeElement.classList.toggle('hidden');
	}

	addChannel() {
		this._channelService.create(this.addModel).subscribe((channel: ChannelModel) => {
			this.customChannels$.getValue().push(channel);
			this._alertService.success(`Channel '${channel.get('name')}' created`)
		}, () => {
			this._alertService.error(`Error creating channel: ${this.addModel.get('name')}`)
		});
	}

	showDetails(model: ChannelModel) {
		let dialogComponentRef = this._modalService.create(ChannelDetailsModalComponent, {
			type: 'dialog',
			title: 'New file',
			showBackdrop: true,
			showCloseButton: false,
			buttons: [
				{value: 'add', text: 'add', type: 'primary'},
				{text: 'cancel', type: 'candel'}
			]
		});
	}

	ngOnDestroy() {
		this._sub.unsubscribe();
	}
}