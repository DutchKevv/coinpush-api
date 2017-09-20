import {debounce} from 'lodash';
import {
	Component, OnInit, OnDestroy, ChangeDetectionStrategy,
	AfterViewChecked, ViewEncapsulation, Output
} from '@angular/core';
import {InstrumentsService} from '../../services/instruments.service';
import {UserService} from '../../services/user.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {UserModel} from '../../models/user.model';
import {ChannelService} from '../../services/channel.service';

declare let $: any;

@Component({
	selector: 'app-user-overview',
	templateUrl: './user.overview.component.html',
	styleUrls: ['./user.overview.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class UserOverviewComponent implements OnInit, OnDestroy, AfterViewChecked {

	@Output() public users$: BehaviorSubject<any[]> = new BehaviorSubject([]);

	private _moveInterval;

	constructor(public instrumentsService: InstrumentsService,
				public channelService: ChannelService,
				public userService: UserService) {
	}

	ngOnInit() {
		return this.userService.getOverview().subscribe((users: Array<UserModel>) => this.users$.next(users));
	}

	ngAfterViewChecked() {
		this.setMoveInterval();
	}

	setMoveInterval() {
		this._moveInterval = setInterval(() => this.moveCards());
	}

	clearMoveInterval() {
		clearInterval(this._moveInterval);
	}

	moveCards() {

	}

	ngOnDestroy() {
		$(window).off('resize.debugger');
	}
}