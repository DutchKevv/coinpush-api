import {debounce} from 'lodash';
import {
	Component, OnInit, OnDestroy, ChangeDetectionStrategy,
	AfterViewChecked, ViewEncapsulation, Output
} from '@angular/core';
import {InstrumentsService} from '../../services/instruments.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {ChannelService} from '../../services/channel.service';

declare let $: any;

@Component({
	selector: 'app-channel-overview',
	templateUrl: './channel-overview.component.html',
	styleUrls: ['./channel-overview.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class ChannelOverviewComponent implements OnInit, OnDestroy, AfterViewChecked {

	@Output() public channels$: BehaviorSubject<any[]> = new BehaviorSubject([]);

	constructor(public instrumentsService: InstrumentsService,
				private _channelService: ChannelService) {
	}

	ngOnInit() {
		this._channelService.getMany().then((list) => {
			this.channels$.next(list)
		});
	}

	ngAfterViewChecked() {
		// console.log('FOOTER FOOTER CHECK!!');
	}

	ngOnDestroy() {

	}
}