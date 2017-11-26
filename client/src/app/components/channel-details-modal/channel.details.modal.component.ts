import {ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService} from '../../services/user.service';
import {AlertService} from '../../services/alert.service';
import {ChannelModel} from '../../models/channel.model';
import {ChannelService} from '../../services/channel.service';

@Component({
	selector: 'app-channel-details-modal',
	templateUrl: './channel.details.modal.component.html',
	styleUrls: ['./channel.details.modal.component.scss'],
	// encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class ChannelDetailsModalComponent implements OnInit {

	@Input() model: ChannelModel;

	constructor(public elementRef: ElementRef,
				private _channelService: ChannelService) {
	}

	ngOnInit() {

	}

	onClickButton(value: string): void {

	}
}