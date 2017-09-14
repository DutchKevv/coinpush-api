import {ChangeDetectionStrategy, Component, Input, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService} from '../../services/user.service';
import {AlertService} from '../../services/alert.service';
import {ChannelModel} from '../../models/channel.model';
import {ChannelService} from '../../services/channel.service';

@Component({
	selector: 'app-channel-row',
	templateUrl: './channel.row.component.html',
	styleUrls: ['./channel.row.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class ChannelRowComponent implements OnInit {

	@Input() model: ChannelModel;
	public isSelf = false;

	constructor(private _channelService: ChannelService, private _userService: UserService) {}

	ngOnInit() {
		this.isSelf = this._userService.model.get('_id') === this.model.get('user_id');
	}

	onClickDelete() {
		this._channelService.delete(this.model).subscribe(() => {

		}, () => {

		});
	}

	onClickTogglePublic(state) {
		this._channelService.update(this.model, {public: !!state}).subscribe(() => {
			console.log('asdf');
		});
	}
}