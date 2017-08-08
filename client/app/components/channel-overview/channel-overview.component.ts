import {CookieService} from 'ngx-cookie';
import {debounce} from 'lodash';
import {
	Component, ElementRef, OnInit, OnDestroy, ChangeDetectionStrategy, NgZone,
	AfterViewChecked, ViewEncapsulation, Output
} from '@angular/core';
import {InstrumentsService} from '../../services/instruments.service';
import {UserService} from '../../services/user.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {TradingChannelService} from '../../services/trading.channel.service';

declare let $: any;

@Component({
	selector: 'app-channel-overview',
	templateUrl: './channel-overview.component.html',
	styleUrls: ['./channel-overview.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class ChannelOverviewComponent implements OnInit, OnDestroy, AfterViewChecked {

	@Output() public channels$: BehaviorSubject<[]> = new BehaviorSubject([]);

	constructor(public instrumentsService: InstrumentsService,
				private _tradingChannelService: TradingChannelService) {
	}

	ngOnInit() {
		this._tradingChannelService.getList().then((list) => {
			this.channels$.next(list)
		});
	}

	ngAfterViewChecked() {
		// console.log('FOOTER FOOTER CHECK!!');
	}

	ngOnDestroy() {

	}
}